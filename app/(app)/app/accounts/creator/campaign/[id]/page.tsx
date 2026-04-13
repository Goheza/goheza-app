'use client'
import Image from 'next/image'
import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import PaymentDialog from '@/components/workspace/pages/creator/paymentOptions/paymentOptions'
import Link from 'next/link'
import { hasPresentPaymentMethod } from '@/components/workspace/pages/creator/paymentOptions/hasPayment'
import { areSocialsAvailable } from '@/lib/appServiceData/social-media/verifySocials'
import { activateTiktokOAuth } from '@/lib/appServiceData/social-media/tiktok/tiktok-auth'

interface ICampaignAssets {
    name: string
    url: string
}
export interface ICampaignDetails {
    id: string
    campaignName: string
    campaignRequirements: string[]
    campaignDescription: string
    campaignPayout: string
    campaignAssets: Array<ICampaignAssets>
    campaignObjective?: string
    targetAudience?: string
    campaignDos?: string | null
    campaignDonts?: string | null
    prohibitedContent?: string[]
    brandLogoUrl?: string | null
    maxSubmissions: number
    status: string
    expiresAt: string | null
}

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
    const [socialsAvailable, setSocialsAvailable] = useState<boolean>(true) // default true to avoid flash
    const router = useRouter()

    useEffect(() => {
        const fetchCampaignDetails = async () => {
            if (!campaignId) {
                setError('Campaign ID not found')
                setLoading(false)
                return
            }
            try {
                const { data, error: fetchError } = await supabaseClient
                    .from('campaigns')
                    .select(
                        `
                        *,
                        brand_profiles(logo_url)
                        `
                    )
                    .eq('id', campaignId)
                    .single()
                if (fetchError) throw new Error(fetchError.message)
                if (!data) throw new Error('Campaign not found')
                const fallbackImage = `https://placehold.co/400x225/e85c51/ffffff?text=${
                    (data.name || data.campaign_name)?.charAt(0) ?? 'C'
                }`
                const imageSource = data.cover_image_url || data.brand_profiles?.logo_url || fallbackImage
                setCampaignDetails({
                    campaignDescription: data.description || '',
                    id: data.id,
                    campaignName: data.name || data.campaign_name,
                    campaignRequirements: data.requirements || [],
                    campaignPayout: data.payout || data.campaign_payout,
                    campaignAssets: data.assets || data.campaign_assets || [],
                    campaignObjective: data.objective,
                    targetAudience: data.audience,
                    campaignDos: data.dos || null,
                    campaignDonts: data.donts || null,
                    prohibitedContent: data.prohibited_content || [],
                    brandLogoUrl: imageSource,
                    maxSubmissions: data.max_submissions ?? 0,
                    status: data.status,
                    expiresAt: data.expires_at || null,
                })
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch campaign details')
            } finally {
                setLoading(false)
            }
        }

        const socialsCheck = async () => {
            const result = await areSocialsAvailable()
            setSocialsAvailable(result)
        }

        socialsCheck()
        fetchCampaignDetails()
    }, [campaignId])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
            setUploadStatus('idle')
            setUploadProgress(0)
        }
    }, [])

   const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
        'video/mp4': ['.mp4'],
        'video/quicktime': ['.mov'],        // iPhone default format
        'video/x-mov': ['.mov'],            // alternate MOV MIME
        'video/webm': ['.webm'],
        'video/ogg': ['.ogv'],
        'video/avi': ['.avi'],
        'video/x-msvideo': ['.avi'],        // alternate AVI MIME
        'video/x-matroska': ['.mkv'],
        'video/3gpp': ['.3gp'],             // older mobile format
        'video/x-m4v': ['.m4v'],            // iTunes/Apple video
    },
})

    const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCaption(e.target.value)
    }

    const handleAgreementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAgreedToTerms(e.target.checked)
    }

    const isCampaignOpen =
        campaignDetails?.status === 'approved' &&
        (campaignDetails?.expiresAt == null || new Date(campaignDetails.expiresAt) > new Date())

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!isCampaignOpen) {
            toast.error('This campaign is no longer accepting submissions.')
            return
        }
        if (!socialsAvailable) {
            toast.error('Please connect your TikTok account before submitting.')
            return
        }
        if (!file) {
            toast.error('Please upload a video file.')
            return
        }
        if (!isAgreedToTerms) {
            toast.error('You must agree to the Campaign Terms and Guidelines before submitting.')
            return
        }
        toast.success('Checking for payment method...')
        const hasPaymentMethod = await hasPresentPaymentMethod()
        if (!hasPaymentMethod) {
            toast.error('Please add a payment method first.')
            setShowPaymentDetails(true)
            return
        }
        toast.success('Checking For Existing Social Account...')
        if (campaignDetails && campaignDetails.maxSubmissions > 0) {
            const { count, error: countError } = await supabaseClient
                .from('campaign_submissions')
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', campaignId)
            if (!countError && count !== null && count >= campaignDetails.maxSubmissions) {
                toast.error('This campaign has reached its maximum number of submissions.')
                return
            }
        }
        setUploadStatus('uploading')
        toast.success('Uploading submission...')
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
            if (userError || !user) throw new Error('User not authenticated')
            const fileName = `${Date.now()}_${file.name}`
            const { error: uploadError } = await supabaseClient.storage.from('campaign-videos').upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            })
            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
            clearInterval(uploadInterval)
            setUploadProgress(100)
            const {
                data: { publicUrl },
            } = supabaseClient.storage.from('campaign-videos').getPublicUrl(fileName)
            toast.success('Please wait...')
            const { error: dbError } = await supabaseClient
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
                        status: 'pending',
                    },
                ])
                .select()
            if (dbError) throw new Error(`Database error: ${dbError.message}`)
            setUploadStatus('success')
            toast.success('Submission successful! It is now pending review.')
            router.push('/app/accounts/creator/submissions')
        } catch (error) {
            clearInterval(uploadInterval)
            setUploadStatus('failure')
            console.error('Submission error:', error)
            toast.error('Submission failed. Please try again.')
        }
    }

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
                            />
                        </div>
                        <span className="text-sm mt-1">{uploadProgress}%</span>
                    </>
                )
            case 'success':
                return <p className="mt-2 text-green-500 italic">File uploaded successfully. Redirecting...</p>
            case 'failure':
                return <p className="mt-2 text-red-500 italic">File upload failed. Please try again.</p>
            default:
                return null
        }
    }

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

    return (
        <div className="font-sans p-5 space-y-12 max-w-4xl mx-auto mb-8">
            {/* TikTok Account Banner — very top, above everything */}
            {!socialsAvailable && (
                <div className="flex items-center justify-between gap-4 bg-orange-50 border border-orange-300 rounded-xl px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-semibold text-orange-800 text-sm">No TikTok account connected</p>
                            <p className="text-orange-700 text-xs mt-0.5">
                                You need to connect a TikTok account before you can submit to campaigns.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={activateTiktokOAuth}
                        className="shrink-0 bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                        Connect TikTok
                    </button>
                </div>
            )}

            {/* Campaign Banner */}
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
            {!isCampaignOpen && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                    <p className="text-yellow-700 font-medium">
                        {campaignDetails.status !== 'approved'
                            ? 'This campaign is not currently accepting submissions.'
                            : 'This campaign has expired and is no longer accepting submissions.'}
                    </p>
                </div>
            )}
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
                        {campaignDetails.campaignObjective && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Objective</h3>
                                <p className="text-gray-700 leading-relaxed">{campaignDetails.campaignObjective}</p>
                            </div>
                        )}
                        {campaignDetails.targetAudience && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Target Audience</h3>
                                <p className="text-gray-700 leading-relaxed">{campaignDetails.targetAudience}</p>
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-700 leading-relaxed">{campaignDetails.campaignDescription}</p>
                        </div>
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
                <h2 className="text-2xl font-semibold mb-2">Max Payout</h2>
                <span className="text-lg font-bold text-[#e93838]">{campaignDetails.campaignPayout}</span>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-7">Campaign Assets</h2>
                <div className="flex flex-wrap gap-4">
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
                        const placeholderSrc = '/placeholder.png'
                        return (
                            <div className="space-y-3" key={`asset-${index}`}>
                                <a
                                    href={v.url}
                                    download={v.name || `asset-${index}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border rounded-2xl border-neutral-400 w-[300px] h-[300px] flex flex-col items-center justify-center text-center overflow-hidden group no-underline text-black"
                                >
                                    {isImage ? (
                                        <Image
                                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                            src={v.url}
                                            alt={v.name || 'Campaign Asset'}
                                            width={300}
                                            height={300}
                                        />
                                    ) : isVideo ? (
                                        <video
                                            className="w-full h-full object-cover bg-black"
                                            src={v.url}
                                            muted
                                            preload="metadata"
                                        >
                                            <source
                                                src={v.url}
                                                type={`video/${assetNameLower.substring(
                                                    assetNameLower.lastIndexOf('.') + 1
                                                )}`}
                                            />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
                                            <Image
                                                src={placeholderSrc}
                                                alt="Placeholder"
                                                width={64}
                                                height={64}
                                                className="mb-2"
                                            />
                                            <p className="text-sm">
                                                File: {v.name.split('.').pop()?.toUpperCase() || 'Unknown'}
                                            </p>
                                        </div>
                                    )}
                                </a>
                                <a
                                    href={v.url}
                                    download={v.name || `asset-${index}`}
                                    className="text-sm mt-3 text-[#e93838] hover:text-[#e85c51] block text-center truncate px-2"
                                    title={v.name}
                                >
                                    {v.name}
                                </a>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Submission Form — hidden if campaign is closed OR no TikTok connected */}
            {isCampaignOpen && socialsAvailable && (
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
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video File (MP4 only)</label>
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200 ease-in-out ${
                                isDragActive ? 'border-[#e85c51] bg-[#fdf3f3]' : 'border-gray-300 bg-white'
                            }`}
                        >
                            <input {...getInputProps()} />
                            {file ? (
                                <p className="text-gray-900">{file.name}</p>
                            ) : (
                                <p className="text-[#e93838]">
                                    Drag and drop your MP4 file here, or click to select a file
                                </p>
                            )}
                            {renderFileStatus()}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <input
                            id="terms-agreement"
                            type="checkbox"
                            checked={isAgreedToTerms}
                            onChange={handleAgreementChange}
                            className="h-4 w-4 text-[#e93838] border-gray-300 rounded focus:ring-[#e93838]"
                        />
                        <p className="text-xs text-black text-center leading-relaxed">
                            I agree with the{' '}
                            <Link
                                href="/terms"
                                target="_blank"
                                className="underline text-[#e93838] hover:text-gray-700"
                            >
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
                        onClick={()=>{
                            toast.success('uploading...')
                        }}
                        className={`w-[150px] mb-5 float-right font-bold py-3 px-4 text-white rounded-lg transition-colors duration-200 ${
                            uploadStatus === 'uploading' || !file || !isAgreedToTerms
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#e93838] hover:bg-[#f17474]'
                        }`}
                        disabled={uploadStatus === 'uploading' || !file || !isAgreedToTerms}
                    >
                        {uploadStatus === 'uploading' ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            )}
        </div>
    )
}
