'use client'
import Image from 'next/image'
import { useState, useCallback, useEffect, useRef } from 'react'
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

const PENDING_SUBMISSION_KEY = 'pendingCampaignSubmission'

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
    const router = useRouter()

    // FIX 1: Ref to always hold the latest file without being a dep of effects
    const fileRef = useRef<File | null>(null)
    useEffect(() => {
        fileRef.current = file
    }, [file])

    // FIX 2: Guard ref to prevent uploadAndSubmit from running concurrently
    const isSubmittingRef = useRef(false)

    // ── Core upload + DB insert ───────────────────────────────────────────────
    const uploadAndSubmit = useCallback(
        async (captionValue: string, details: ICampaignDetails) => {
            // FIX 2: Bail out immediately if a submission is already in flight
            if (isSubmittingRef.current) return
            isSubmittingRef.current = true

            const currentFile = fileRef.current
            if (!currentFile) {
                toast.error('Video file is missing. Please re-select it and try again.')
                setUploadStatus('failure')
                isSubmittingRef.current = false
                return
            }

            if (details.maxSubmissions > 0) {
                const { count, error: countError } = await supabaseClient
                    .from('campaign_submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('campaign_id', campaignId)

                if (!countError && count !== null && count >= details.maxSubmissions) {
                    toast.error('This campaign has reached its maximum number of submissions.')
                    isSubmittingRef.current = false
                    return
                }
            }

            setUploadStatus('uploading')
            toast.success('Uploading your submission…')
            setUploadProgress(0)

            const uploadInterval = setInterval(() => {
                setUploadProgress((prev) => (prev >= 90 ? prev : prev + 10))
            }, 500)

            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabaseClient.auth.getUser()
                if (userError || !user) throw new Error('User not authenticated')

                const fileName = `${Date.now()}_${currentFile.name}`
                const { error: uploadError } = await supabaseClient.storage
                    .from('campaign-videos')
                    .upload(fileName, currentFile, { cacheControl: '3600', upsert: false })
                if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

                clearInterval(uploadInterval)
                setUploadProgress(100)

                const {
                    data: { publicUrl },
                } = supabaseClient.storage.from('campaign-videos').getPublicUrl(fileName)

                const { error: dbError } = await supabaseClient
                    .from('campaign_submissions')
                    .insert([
                        {
                            user_id: user.id,
                            campaign_id: campaignId,
                            campaign_name: details.campaignName,
                            video_url: publicUrl,
                            caption: captionValue,
                            file_name: currentFile.name,
                            file_size: currentFile.size,
                            submitted_at: new Date().toISOString(),
                            status: 'draft',
                        },
                    ])
                    .select()
                if (dbError) throw new Error(`Database error: ${dbError.message}`)

                sessionStorage.removeItem(PENDING_SUBMISSION_KEY)
                setUploadStatus('success')
                toast.success('Submission successful! It is now pending review.')
                router.push('/app/accounts/creator/submissions')
            } catch (err) {
                clearInterval(uploadInterval)
                setUploadStatus('failure')
                console.error('Submission error:', err)
                toast.error('Submission failed. Please try again.')
                sessionStorage.removeItem(PENDING_SUBMISSION_KEY)
            } finally {
                // FIX 2: Always release the lock when done
                isSubmittingRef.current = false
            }
        },
        [campaignId, router]
    )

    // FIX 3: Keep a stable ref to uploadAndSubmit so the fetch effect below
    // doesn't need it as a dependency (which would cause it to re-run and
    // trigger the auto-resume logic multiple times).
    const uploadAndSubmitRef = useRef(uploadAndSubmit)
    useEffect(() => {
        uploadAndSubmitRef.current = uploadAndSubmit
    }, [uploadAndSubmit])

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
                    .select(`*, brand_profiles(logo_url)`)
                    .eq('id', campaignId)
                    .single()

                if (fetchError) throw new Error(fetchError.message)
                if (!data) throw new Error('Campaign not found')

                const fallbackImage = `https://placehold.co/400x225/e85c51/ffffff?text=${
                    (data.name || data.campaign_name)?.charAt(0) ?? 'C'
                }`
                const imageSource = data.cover_image_url || data.brand_profiles?.logo_url || fallbackImage

                const details: ICampaignDetails = {
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
                }

                setCampaignDetails(details)

                // ── Auto-resume after TikTok OAuth redirect ───────────────
                const pending = sessionStorage.getItem(PENDING_SUBMISSION_KEY)
                if (pending) {
                    const { campaignId: savedId, caption: savedCaption } = JSON.parse(pending)
                    if (savedId === campaignId) {
                        const hasTikTok = await areSocialsAvailable()
                        if (hasTikTok) {
                            setCaption(savedCaption)
                            // FIX 4: Remove the key IMMEDIATELY before scheduling
                            // the timeout, so a second effect run can't trigger
                            // another auto-resume while the first is in flight.
                            sessionStorage.removeItem(PENDING_SUBMISSION_KEY)
                            toast.info('TikTok connected! Resuming your submission…')
                            // Give React a tick to apply state before uploading.
                            // Use the ref so this effect doesn't need uploadAndSubmit
                            // as a dependency.
                            setTimeout(() => uploadAndSubmitRef.current(savedCaption, details), 100)
                        } else {
                            // OAuth failed or was cancelled — clean up and let them retry
                            sessionStorage.removeItem(PENDING_SUBMISSION_KEY)
                            toast.error('TikTok connection failed. Please try again.')
                        }
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch campaign details')
            } finally {
                setLoading(false)
            }
        }

        fetchCampaignDetails()
        // FIX 3: campaignId is the only real dependency here. uploadAndSubmit
        // is accessed via uploadAndSubmitRef so its identity changes don't
        // re-trigger this effect.
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
            'video/quicktime': ['.mov'],
            'video/x-mov': ['.mov'],
            'video/webm': ['.webm'],
            'video/ogg': ['.ogv'],
            'video/avi': ['.avi'],
            'video/x-msvideo': ['.avi'],
            'video/x-matroska': ['.mkv'],
            'video/3gpp': ['.3gp'],
            'video/x-m4v': ['.m4v'],
        },
    })

    const isCampaignOpen =
        campaignDetails?.status === 'approved' &&
        (campaignDetails?.expiresAt == null || new Date(campaignDetails.expiresAt) > new Date())

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!isCampaignOpen) {
            toast.error('This campaign is no longer accepting submissions.')
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

        // ── Step 1: Payment check ──────────────────────────────────────────
        const hasPaymentMethod = await hasPresentPaymentMethod()
        if (!hasPaymentMethod) {
            toast.info('Please add a payment method to continue.')
            setShowPaymentDetails(true)
            return
        }

        // ── Step 2: TikTok check ───────────────────────────────────────────
        const hasTikTok = await areSocialsAvailable()
        if (!hasTikTok) {
            // Persist caption + campaignId so we can resume after OAuth
            sessionStorage.setItem(PENDING_SUBMISSION_KEY, JSON.stringify({ campaignId, caption }))
            toast.info("Please link your TikTok account to continue. You'll be redirected back here.")
            await new Promise((r) => setTimeout(r, 800))
            await activateTiktokOAuth()
            return
        }

        // ── Step 3: Upload & submit ────────────────────────────────────────
        await uploadAndSubmit(caption, campaignDetails!)
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
        <div className="font-sans px-4 sm:px-6 py-6 space-y-8 sm:space-y-12 max-w-4xl mx-auto mb-8">
            {/* Campaign Banner */}
            <div className="relative w-full h-[180px] sm:h-[240px] md:h-[300px] rounded-2xl overflow-hidden bg-gray-200">
                <Image
                    src={defaultBannerUrl}
                    alt={`${campaignDetails.campaignName} Banner`}
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 896px) 896px, 896px"
                    className="object-cover"
                />
            </div>

            {/* Campaign Name */}
            <div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-neutral-850">Campaign Name</h2>
                <span className="text-lg font-bold text-[#e93838]">{campaignDetails.campaignName}</span>
            </div>

            {/* Closed campaign notice */}
            {!isCampaignOpen && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                    <p className="text-yellow-700 font-medium">
                        {campaignDetails.status !== 'approved'
                            ? 'This campaign is not currently accepting submissions.'
                            : 'This campaign has expired and is no longer accepting submissions.'}
                    </p>
                </div>
            )}

            {/* Brief */}
            <div className="bg-white">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button className="py-3 px-1 border-b-2 border-red-500 text-[#e85c51] font-bold text-sm">
                            Brief
                        </button>
                    </nav>
                </div>
                <div className="py-6 space-y-6">
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

            {/* Prohibited Content */}
            {campaignDetails.prohibitedContent && campaignDetails.prohibitedContent.length > 0 && (
                <div className="bg-white p-5 sm:p-6 rounded-lg shadow-inner border border-gray-200">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-[#e85c51]">Prohibited Content</h2>
                    <p className="text-gray-700 mb-4">
                        The following types of content are strictly prohibited and will result in immediate rejection:
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

            {/* Payout */}
            <div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">Max Payout</h2>
                <span className="text-lg font-bold text-[#e93838]">{campaignDetails.campaignPayout}</span>
            </div>

            {/* Campaign Assets */}
            <div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-7">Campaign Assets</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaignDetails.campaignAssets.map((v, index) => {
                        const assetNameLower = v.name.toLowerCase()
                        const isVideo = ['.mp4', '.mov', '.avi'].some((ext) => assetNameLower.endsWith(ext))
                        const isImage = ['.png', '.jpg', '.jpeg'].some((ext) => assetNameLower.endsWith(ext))
                        return (
                            <div className="space-y-3" key={`asset-${index}`}>
                                <a
                                    href={v.url}
                                    download={v.name || `asset-${index}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border rounded-2xl border-neutral-400 w-full aspect-square flex flex-col items-center justify-center overflow-hidden group no-underline text-black block"
                                >
                                    {isImage ? (
                                        <Image
                                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                            src={v.url}
                                            alt={v.name || 'Campaign Asset'}
                                            width={400}
                                            height={400}
                                        />
                                    ) : isVideo ? (
                                        <video
                                            className="w-full h-full object-cover bg-black"
                                            src={v.url}
                                            muted
                                            preload="metadata"
                                        >
                                            <source src={v.url} type={`video/${assetNameLower.split('.').pop()}`} />
                                        </video>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
                                            <Image
                                                src="/placeholder.png"
                                                alt="Placeholder"
                                                width={64}
                                                height={64}
                                                className="mb-2"
                                            />
                                            <p className="text-sm">
                                                {v.name.split('.').pop()?.toUpperCase() || 'Unknown'}
                                            </p>
                                        </div>
                                    )}
                                </a>
                                <a
                                    href={v.url}
                                    download={v.name || `asset-${index}`}
                                    className="text-sm text-[#e93838] hover:text-[#e85c51] block text-center truncate px-2"
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
            {isCampaignOpen && (
                <form className="mb-5 space-y-7" onSubmit={handleSubmit}>
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4">Your Submission</h2>
                    <div>
                        <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                            Caption
                        </label>
                        <textarea
                            id="caption"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write a caption for your video, aligning with the brief's key message."
                            className="w-full h-28 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#e93838]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
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
                                <p className="text-[#e93838]">Drag and drop your video here, or tap to select</p>
                            )}
                            {renderFileStatus()}
                        </div>
                        {/* Remind returning users that file must be re-selected */}
                        {!file && sessionStorage.getItem(PENDING_SUBMISSION_KEY) && (
                            <p className="text-xs text-amber-600 mt-2">
                                ⚠️ Please re-select your video file — files can't be saved across redirects.
                            </p>
                        )}
                    </div>
                    <div className="flex items-start sm:items-center gap-4">
                        <input
                            id="terms-agreement"
                            type="checkbox"
                            checked={isAgreedToTerms}
                            onChange={(e) => setIsAgreedToTerms(e.target.checked)}
                            className="mt-0.5 sm:mt-0 h-4 w-4 text-[#e93838] border-gray-300 rounded focus:ring-[#e93838] shrink-0"
                        />
                        <p className="text-xs text-black leading-relaxed">
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
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className={`w-full sm:w-[150px] mb-5 font-bold py-3 px-4 text-white rounded-lg transition-colors duration-200 ${
                                uploadStatus === 'uploading' || !file || !isAgreedToTerms
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-[#e93838] hover:bg-[#f17474]'
                            }`}
                            disabled={uploadStatus === 'uploading' || !file || !isAgreedToTerms}
                        >
                            {uploadStatus === 'uploading' ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
