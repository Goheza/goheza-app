'use client'

import Image from 'next/image'
import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { baseLogger } from '@/lib/logger'
import { toast } from 'sonner'
import PaymentDialog from '@/components/components/paymentOptions/paymentOptions'
// import { checkIFPaymentExists } from '@/lib/ats/checkForPaymentMethod' // Not used
import Link from 'next/link'
import { hasPresentPaymentMethod } from '@/components/components/paymentOptions/hasPayment'

interface ICampaignAssets {
    name: string
    url: string
}

// 🛑 UPDATED: Added status and expiresAt to the interface
export interface ICampaignDetails {
    id: string
    campaignName: string
    campaignRequirements: string[]
    campaignPayout: string
    campaignAssets: Array<ICampaignAssets>
    campaignObjective?: string
    targetAudience?: string
    campaignDos?: string | null
    campaignDonts?: string | null
    prohibitedContent?: string[]
    brandLogoUrl?: string | null
    status: 'approved' | 'inreview' | 'cancelled' | 'expired'
    expiresAt: string | null
}

// ==================================================================================
// NEW HELPER FUNCTION: Calculates days left until expiration
// ==================================================================================
const calculateDaysLeft = (expiresAt: string | null): number | 'Expired' => {
    if (!expiresAt) return 999 // If no expiration date is set, assume active for simplicity
    
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    
    // Check if it's already expired
    if (expirationDate <= now) {
        return 'Expired'
    }

    // Calculate days remaining
    const diffTime = expirationDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Return a minimum of 1 day if it's less than 24 hours but not yet expired
    return Math.max(1, diffDays)
}

// ==================================================================================
// HELPER FUNCTION: Split a multi-line string into a clean array for display
// ==================================================================================
const splitAndFilterList = (listString: string | null | undefined): string[] => {
    if (!listString) return []
    return listString
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
}

export default function CampaignOverview() {
    const params = useParams()
    const campaignId = params.id as string

    const [willShowPaymentDetails, setShowPaymentDetails] = useState(false)
    const [campaignDetails, setCampaignDetails] = useState<ICampaignDetails | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const [caption, setCaption] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'failure'>('idle')
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const [isAgreedToTerms, setIsAgreedToTerms] = useState<boolean>(false)

    // 🛑 NEW STATE: To hold the calculated expiration info
    const [daysLeft, setDaysLeft] = useState<number | 'Expired' | null>(null)
    
    const router = useRouter()

    useEffect(() => {
        const fetchCampaignDetails = async () => {
            if (!campaignId) {
                setError('Campaign ID not found')
                setLoading(false)
                return
            }

            try {
                // 🛑 FIXED: Ensure we select the new columns status and expires_at
                const { data, error: fetchError } = await supabaseClient
                    .from('campaigns')
                    .select(
                        `
                        id, name, requirements, payout, assets, objectives,
                        dos, donts, prohibited_content, cover_image_url,
                        status, expires_at, brand_profiles(logo_url)
                        `
                    )
                    .eq('id', campaignId)
                    .single()

                if (fetchError) {
                    throw new Error(fetchError.message)
                }

                if (!data) {
                    throw new Error('Campaign not found')
                }

                // 🛑 FIXED: Calculate days left using the fetched expires_at
                const calculatedDaysLeft = calculateDaysLeft(data.expires_at)
                setDaysLeft(calculatedDaysLeft)

                const fallbackImage = `https://placehold.co/400x225/e85c51/ffffff?text=${
                    (data.name)?.charAt(0) ?? 'C'
                }`

                //@ts-ignore
                const imageSource = data.cover_image_url || (data.brand_profiles as { logo_url: string | null })?.logo_url || fallbackImage
                
                setCampaignDetails({
                    id: data.id,
                    campaignName: data.name,
                    campaignRequirements: data.requirements || [],
                    campaignPayout: data.payout,
                    campaignAssets: data.assets || [],
                    // NOTE: The database schema provided only had `objectives` as an array, 
                    // not `objective` as a string. Using first element or converting if necessary.
                    campaignObjective: data.objectives?.[0] ?? undefined, 
                    targetAudience: undefined, // Field not in the provided schema
                    campaignDos: data.dos || null,
                    campaignDonts: data.donts || null,
                    prohibitedContent: data.prohibited_content || [],
                    brandLogoUrl: imageSource,
                    status: data.status as ICampaignDetails['status'], // Type assertion based on schema
                    expiresAt: data.expires_at,
                })
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch campaign details')
            } finally {
                setLoading(false)
            }
        }

        fetchCampaignDetails()
    }, [campaignId])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
            setUploadStatus('idle')
            setUploadProgress(0)
        }
    }, [])

    // 🛑 LOGIC FIX: Disable dropzone if campaign is expired or form is generally disabled
    const isCampaignExpired = daysLeft === 'Expired' || campaignDetails?.status === 'expired'

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'video/mp4': ['.mp4'],
        },
        disabled: isCampaignExpired,
    })

    const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCaption(e.target.value)
    }

    const handleAgreementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAgreedToTerms(e.target.checked)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // 🛑 EXPIRATION CHECK: Deny submission if expired
        if (isCampaignExpired) {
            toast.error('Campaign is expired. Submissions are no longer accepted.')
            return
        }

        toast.success('Checking For Payment Method...')
        const hasPaymentMethod = await hasPresentPaymentMethod()

        if (hasPaymentMethod) {
            if (!file) {
                toast.error('Please upload a video file.')
                return
            }

            if (!isAgreedToTerms) {
                toast.error('You must agree to the Campaign Terms and Guidelines before submitting.')
                return
            }

            baseLogger('CREATOR-OPERATIONS', 'WillMakeCampaignSubmission')
            setUploadStatus('uploading')
            toast.success('Uploading Submission')
            setUploadProgress(0)

            const uploadInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) return prev
                    return prev + 10
                })
            }, 500)

            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabaseClient.auth.getUser()

                if (userError || !user) {
                    throw new Error('User not authenticated')
                }

                // 1. Upload the video file
                const fileName = `${Date.now()}_${file.name}`
                const { data: uploadData, error: uploadError } = await supabaseClient.storage
                    .from('campaign-videos')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false,
                    })

                if (uploadError) {
                    throw new Error(`Upload failed: ${uploadError.message}`)
                }
                clearInterval(uploadInterval)
                setUploadProgress(100)
                setUploadStatus('success')

                // 2. Get the public URL
                const {
                    data: { publicUrl },
                } = supabaseClient.storage.from('campaign-videos').getPublicUrl(fileName)

                // 3. Save the submission details to the database
                const { data: submissionData, error: dbError } = await supabaseClient
                    .from('campaign_submissions')
                    .insert([
                        {
                            user_id: user.id,
                            campaign_id: campaignId,
                            campaign_name: campaignDetails?.campaignName,
                            video_url: publicUrl,
                            caption: caption,
                            file_name: file.name,
                            file_size: file.size,
                            submitted_at: new Date().toISOString(),
                            status: 'draft',
                        },
                    ])
                    .select()

                if (dbError) {
                    throw new Error(`Database error: ${dbError.message}`)
                }

                toast.success('Submission Successful! It is now pending review.')
                router.push('/main/creator/submissions')
            } catch (error) {
                clearInterval(uploadInterval)
                setUploadStatus('failure')
                console.error('Submission error:', error)
                toast.error('Submission failed.')
            }
        } else {
            toast.success('Add Payment Method Please!.')
            setShowPaymentDetails(true)
        }
    }

    // 🛑 LOGIC FIX: Use isCampaignExpired for file status
    const renderFileStatus = () => {
        switch (uploadStatus) {
            case 'uploading':
                return (
                    <>
                        <p className="mt-2 text-gray-500 italic">Uploading...</p>
                        <div className="w-full h-2 bg-gray-200 rounded-lg mt-2">
                            <div
                                className="h-full bg-[#e85c51] rounded-lg transition-all duration-300 ease-in-out"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <span className="text-sm mt-1">{uploadProgress}%</span>
                    </>
                )
            case 'success':
                return <p className="mt-2 text-green-500 italic">File uploaded successfully. Redirecting...</p>
            case 'failure':
                return <p className="mt-2 text-red-500 italic">File upload failed. Please try again.</p>
            default:
                if (isCampaignExpired) {
                     return <p className="mt-2 text-red-500 italic font-semibold">Campaign is Expired. Submissions are closed.</p>
                }
                return null
        }
    }

    // Determine if the entire form should be disabled
    const isFormDisabled = uploadStatus === 'uploading' || isCampaignExpired

    // --- Loading, Error, and Not Found States ---
    if (loading) {
        return (
            <div className="font-sans p-5 max-w-4xl mx-auto">
                <div className="flex justify-center items-center h-64">
                    <p className="text-lg text-gray-600">Loading campaign details...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="font-sans p-5 mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-[#e85c51]">Error: {error}</p>
                </div>
            </div>
        )
    }

    if (!campaignDetails) {
        return (
            <div className="font-sans p-5 max-w-4xl mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-600">Campaign not found</p>
                </div>
            </div>
        )
    }

    const defaultBannerUrl = campaignDetails.brandLogoUrl!

    const dosList = splitAndFilterList(campaignDetails.campaignDos)
    const dontsList = splitAndFilterList(campaignDetails.campaignDonts)

    // --- Main Campaign Overview & Submission Form ---
    return (
        <div className="font-sans p-5 space-y-12 max-w-4xl mx-auto mb-8">
            
            {/* 🛑 EXPIRATION/STATUS ALERT BOX */}
            {/* Only show if expired OR days left is 7 or less */}
            {(isCampaignExpired || (typeof daysLeft === 'number' && daysLeft <= 7)) && daysLeft !== 999 && (
                <div className={`
                    p-3 rounded-lg text-center font-bold text-sm mx-auto
                    ${isCampaignExpired
                        ? 'bg-red-100 text-red-700 border border-red-300' // Expired Style
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-300' // Warning/Days Left Style
                    }
                `}>
                    {isCampaignExpired ? (
                        '🚫 This Campaign is **EXPIRED**. Submissions are closed.'
                    ) : (
                        `⏳ This campaign has **${daysLeft} days left** until expiration.`
                    )}
                </div>
            )}
            {/* 🛑 END of Expiration/Status Alert Box */}

            {/* Campaign Banner - Uses Brand Logo URL */}
            <div className="bg-gray-200 h-[200px] mb-12 rounded-2xl overflow-hidden">
                <img
                    src={defaultBannerUrl}
                    className="w-full h-[200px] object-cover"
                    alt={`${campaignDetails.campaignName} Banner`}
                />
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-2 text-neutral-850">Campaign Name</h2>
                <span className="text-lg font-bold text-[#e93838]">{campaignDetails.campaignName}</span>
            </div>

            <div className="bg-white">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button className="py-3 px-1 border-b-2 border-red-500 text-[#e85c51] font-bold text-sm transition-colors">
                            Brief
                        </button>
                    </nav>
                </div>

                <div className="py-6">
                    <div className="space-y-6">
                        {/* The Objective Section */}
                        {campaignDetails.campaignObjective && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Objective</h3>
                                <p className="text-gray-700 leading-relaxed">{campaignDetails.campaignObjective}</p>
                            </div>
                        )}

                        {/* The Key Requirements/Deliverables Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements & Deliverables</h3>
                            <ul className="space-y-3 pl-5 list-disc text-gray-700">
                                {campaignDetails.campaignRequirements.map((item, id) => (
                                    <li key={id}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Do's and Don'ts Section */}
                        {(dosList.length > 0 || dontsList.length > 0) && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
                                    Creative Guidelines: Do's and Don'ts
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {dosList.length > 0 && (
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-green-700 mb-2">Do's ✅</h4>
                                            <ul className="space-y-2 text-green-800 list-disc pl-5">
                                                {dosList.map((item, id) => (
                                                    <li key={id}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {dontsList.length > 0 && (
                                        <div className="bg-red-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-red-700 mb-2">Don'ts 🚫</h4>
                                            <ul className="space-y-2 text-red-800 list-disc pl-5">
                                                {dontsList.map((item, id) => (
                                                    <li key={id}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Prohibited Content Section */}
            {campaignDetails.prohibitedContent && campaignDetails.prohibitedContent.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-inner border border-gray-200">
                    <h2 className="text-2xl font-semibold mb-4 text-[#e85c51]">Prohibited Content</h2>
                    <p className="text-gray-700 mb-4">
                        The following types of content are strictly prohibited and will result in the immediate
                        rejection of your submission:
                    </p>
                    <ul className="space-y-2 text-gray-800 list-disc pl-5">
                        {campaignDetails.prohibitedContent.map((item, id) => (
                            <li key={id} className="text-sm">
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div>
                <h2 className="text-2xl font-semibold mb-2">Payout</h2>
                <span className="text-lg font-bold text-[#e93838]">{campaignDetails.campaignPayout}</span>
            </div>

            {/* Campaign Assets Section (No changes needed here) */}
            <div>
                <h2 className="text-2xl font-semibold mb-7">Campaign Assets</h2>
                <div className="flex gap-2">
                    {campaignDetails.campaignAssets.map((v, index) => {
                        const assetNameLower = v.name.toLowerCase()
                        const isVideo =
                            assetNameLower.endsWith('.mp4') ||
                            assetNameLower.endsWith('.mov') ||
                            assetNameLower.endsWith('.avi')
                        const isImage =
                            assetNameLower.endsWith('.png') ||
                            assetNameLower.endsWith('.jpg') ||
                            assetNameLower.endsWith('.jpeg')

                        const imageSrc = isImage
                            ? v.url
                            : isVideo
                            ? '/images/video-placeholder.svg'
                            : '/placeholder.png'

                        return (
                            <div className="space-y-5" key={`asset-${index}`}>
                                <div className="flex border rounded-2xl border-neutral-400 w-[300px] h-[300px] flex-col items-center justify-center text-center overflow-hidden">
                                    <a
                                        href={v.url}
                                        download={v.name || `asset-${index}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group no-underline text-black w-full h-full"
                                    >
                                        <Image
                                            className="rounded-2xl w-full h-full object-cover"
                                            src={imageSrc}
                                            alt={v.name || 'Campaign Asset'}
                                            width={300}
                                            height={300}
                                        />
                                    </a>
                                </div>
                                <a
                                    href={v.url}
                                    download={v.name || `asset-${index}`}
                                    className="text-sm mt-6 text-[#e93838] hover:text-[#f17474] block text-center truncate"
                                    title={v.name}
                                >
                                    {v.name}
                                </a>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Submission Form */}
            <form className="mb-5 space-y-7" onSubmit={handleSubmit}>
                <h2 className="text-2xl font-semibold mb-4">Your Submission</h2>

                <div>
                    <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                        Caption
                    </label>
                    <textarea
                        id="caption"
                        value={caption}
                        onChange={handleCaptionChange}
                        placeholder="Write a caption for your video, aligning with the brief's key message."
                        className="w-full h-28 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#e93838]"
                        required
                        disabled={isFormDisabled}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video File (MP4 only)</label>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-5 text-center transition-all duration-200 ease-in-out ${
                            isFormDisabled
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                                : isDragActive
                                ? 'border-[#e85c51] bg-[#fdf3f3] cursor-pointer'
                                : 'border-gray-300 bg-white cursor-pointer'
                        }`}
                    >
                        <input {...getInputProps()} /> 
                        {file ? (
                            <p className="text-gray-900">{file.name}</p>
                        ) : (
                            <p className="text-[#e93838]">
                                {isCampaignExpired ? 'Submissions are closed for this campaign.' : 'Drag and drop your MP4 file here, or click to select a file'}
                            </p>
                        )}
                        {renderFileStatus()}
                    </div>
                </div>

                {/* Terms and Agreement Checkbox */}
                <div className="flex items-center space-x-4 ">
                    <input
                        id="terms-agreement"
                        type="checkbox"
                        checked={isAgreedToTerms}
                        onChange={handleAgreementChange}
                        className="h-4 w-4 text-[#e93838] border-gray-300 rounded focus:ring-[#e93838]"
                        disabled={isFormDisabled}
                    />
                    <p className="text-xs text-black text-center leading-relaxed">
                        I agree with the{' '}
                        <Link href="/terms" target="_blank" className="underline text-[#e93838] hover:text-gray-700">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link
                            href="/privacy-policy"
                            target="_blank"
                            className="underline text-[#e93838] hover:text-gray-700"
                        >
                            Privacy Policy
                        </Link>
                    </p>
                </div>

                <PaymentDialog
                    isPaymentDialogOpen={willShowPaymentDetails}
                    setPaymentDialogOpen={setShowPaymentDetails}
                />

                <button
                    type="submit"
                    className={`w-[150px] mb-5 float-right font-bold py-3 px-4 text-white rounded-lg transition-colors duration-200 ${
                        isFormDisabled || !file || !isAgreedToTerms
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-[#e93838] hover:bg-[#f17474]'
                    }`}
                    disabled={isFormDisabled || !file || !isAgreedToTerms}
                >
                    {uploadStatus === 'uploading' ? 'Submitting...' : 'Submit'}
                </button>
            </form>
        </div>
    )
}