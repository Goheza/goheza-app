'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Wallet,
    Users,
    DollarSign,
    Airplay,
    Video, // Added Video icon for assets
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { baseLogger } from '@/lib/logger'
import { calculateGohezaPayment } from '@/lib/ats/payment-calculator'
import { toast } from 'sonner'
import { addNotificationToTheAdmin } from '@/lib/ats/adminNotifications'
import {
    ProgressState,
    ProgressStep,
    getButtonText,
    getProgressStatus,
} from '@/components/components/brand/new-campaign/progress-step'
import DosDontsList from '@/components/components/brand/new-campaign/DosDonts'
import { uploadFilesToStorage } from '@/components/components/brand/new-campaign/lib/uploadFilesToStorage'

interface CampaignFormData {
    title: string
    description: string
    objectives: string // single selected objective (keeps newer UI behavior)
    objectivesArray: string[] // for DB compatibility (older file expected array)
    contentRequirements: string[]
    estimatedViews: number
    totalBudget: number
    // fields pulled from older component
    budget?: string // string representation used for DB (e.g., "$5,000")
    payout?: string
    timeline?: string
    requirementsText?: string[] // free-form requirements list

    // NEW fields
    information?: string
    dos?: string
    donts?: string
    countries?: string // comma separated input
    numCreators?: number
    maxPay?: string
    max_submissions?: number
    flatFee?: string

    // REQUESTED: Field for Brand Cover Image URL
    coverImageUrl?: string
}

interface PaymentBreakdown {
    numCreators: number
    maxPayout: number
    flatFee: number
    creatorPayoutTotal: number
    platformFee: number
    brandTotalPay: number
    perCreatorTotal: number
    totalViews: number
}

const CampaignBriefForm: React.FC = () => {
    const router = useRouter()

    const [formData, setFormData] = useState<CampaignFormData>({
        title: '',
        description: '',
        objectives: 'increase-brand-awareness',
        objectivesArray: ['increase-brand-awareness'],
        contentRequirements: ['video-ad', 'social-media-posts'],
        estimatedViews: 1000000,
        totalBudget: 1500,
        budget: '$1,500',
        payout: '$500',
        timeline: '1 month',
        requirementsText: [''],
        dos: '',
        donts: '',
        countries: '',
        numCreators: 80, // sensible default
        maxPay: '',
        flatFee: '',
        max_submissions: 5, // sensible default
    })

    /**
     * Used for handling the assets that are going to the brand
     */
    const [brandCoverImage, setBrandCoverImage] = useState<File | null>(null)
    const [brandAssets, setBrandAssets] = useState<File[]>([])
    const [referenceImages, setReferenceImages] = useState<File[]>([])
    const [brandGuidelines, setBrandGuidelines] = useState<File | null>(null)

    /**
     * Used for progress errors and states
     */
    const [progressState, setProgressState] = useState<ProgressState>('idle')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    /**
     * Used for Calculating Payments (for the brand)
     */
    const [numCreators, setNumCreators] = useState(formData.numCreators || 30)
    const [maxPayout, setMaxPayout] = useState(70) // $250 max per creator (example)
    const [flatFee, setFlatFee] = useState(0)
    const [estimatedViewsInput, setEstimatedViewsInput] = useState(formData.estimatedViews.toLocaleString())
    const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null)
    const [paymentError, setPaymentError] = useState<string | null>(null)

    // Local previews (object URLs) so users can download/view before upload
    const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})

    /**
     *
     * Assets DropZones Handlers for the campaign
     *
     */

    const onDropBrandCoverImage = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) setBrandCoverImage(acceptedFiles[0])
    }, [])

    const onDropBrandAssets = useCallback((acceptedFiles: File[]) => {
        setBrandAssets((prev) => [...prev, ...acceptedFiles])
    }, [])

    const onDropReferenceImages = useCallback((acceptedFiles: File[]) => {
        setReferenceImages((prev) => [...prev, ...acceptedFiles])
    }, [])

    const onDropBrandGuidelines = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) setBrandGuidelines(acceptedFiles[0])
    }, [])

    /**
     * DropZone handlers Placed And Attached Evenly
     */
    const { getRootProps: getCoverImageRootProps, getInputProps: getCoverImageInputProps } = useDropzone({
        onDrop: onDropBrandCoverImage,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
        multiple: false,
    })

    const { getRootProps: getBrandAssetsRootProps, getInputProps: getBrandAssetsInputProps } = useDropzone({
        onDrop: onDropBrandAssets,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif'], 'video/*': ['.mp4', '.mov', '.avi', '.webm'] },
        multiple: true,
    })

    const { getRootProps: getReferenceImagesRootProps, getInputProps: getReferenceImagesInputProps } = useDropzone({
        onDrop: onDropReferenceImages,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
        multiple: true,
    })

    const { getRootProps: getBrandGuidelinesRootProps, getInputProps: getBrandGuidelinesInputProps } = useDropzone({
        onDrop: onDropBrandGuidelines,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        multiple: false,
    })

    // --- File URL Effect ---
    useEffect(() => {
        /**
         * Generate Object URLs for Easy download and Preview
         * @returns
         */

        const generateObjectURLSForEasyDownloadAndPreview = () => {
            const urls: Record<string, string> = {}

            brandAssets.forEach((f, i) => {
                const key = `brand-${i}-${f.name}`
                urls[key] = URL.createObjectURL(f)
            })

            referenceImages.forEach((f, i) => {
                const key = `ref-${i}-${f.name}`
                urls[key] = URL.createObjectURL(f)
            })

            // Handle Brand Cover Image
            if (brandCoverImage) {
                const key = `cover-${brandCoverImage.name}`
                urls[key] = URL.createObjectURL(brandCoverImage)
            }

            if (brandGuidelines) {
                const key = `guidelines-${brandGuidelines.name}`
                urls[key] = URL.createObjectURL(brandGuidelines)
            }

            return urls
        }

        /**
         * Generated URLS
         */
        let urls = generateObjectURLSForEasyDownloadAndPreview()

        /**
         * Used to Revoke the Object URLS
         */
        Object.values(assetUrls).forEach((u) => {
            try {
                URL.revokeObjectURL(u)
            } catch {
                // ignore
            }
        })
        setAssetUrls(urls)

        // cleanup when component unmounts
        return () => {
            Object.values(urls).forEach((u) => {
                try {
                    URL.revokeObjectURL(u)
                } catch {
                    // ignore
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [brandAssets, referenceImages, brandGuidelines, brandCoverImage])

    // --- Core Functions ---

    // Helper to safely parse any input string into a number
    const parseToNumber = (value: string): number => {
        // Remove all non-digit characters (e.g., commas, letters)
        const cleanedValue = value.replace(/[^0-9]/g, '')
        // Parse to integer, default to 0 if empty
        return parseInt(cleanedValue) || 0
    }

    /**
     * Handles payment calculation and aligns the result with the main formData.
     */
    const handlePaymentCalculate = () => {
        setProgressState('calculating') // Set state
        try {
            if (numCreators <= 0 || maxPayout <= 0) {
                throw new Error('Number of creators and Max Payout must be greater than zero.')
            }

            const result = calculateGohezaPayment(numCreators, maxPayout, flatFee)
            setPaymentBreakdown(result)
            setPaymentError(null)

            // 💰 BUDGET ALIGNMENT: Update formData with the calculated total and other payment details
            setFormData((prev) => ({
                ...prev,
                totalBudget: result.brandTotalPay,
                budget: `$${result.brandTotalPay.toLocaleString()}`,
                maxPay: `$${result.maxPayout}`,
                flatFee: `$${flatFee.toLocaleString()}`,
                payout: `$${result.perCreatorTotal}`,
                numCreators: numCreators,
                max_submissions: numCreators,
                estimatedViews: result.totalViews,
            }))
            setProgressState('idle') // Reset state
            toast.success('Budget Calculated!', {
                description: `Total cost: $${result.brandTotalPay.toLocaleString()}`,
            })
        } catch (err: any) {
            setPaymentBreakdown(null)
            setPaymentError(err.message)
            setProgressState('error') // Set error state
            toast.error('Calculation Failed', { description: err.message })
        }
    }

    const handleInputChange = (field: keyof CampaignFormData, value: any) => {
        // keep budget display synced with totalBudget when appropriate
        if (field === 'totalBudget') {
            setFormData((prev) => ({ ...prev, totalBudget: value, budget: `$${Number(value).toLocaleString()}` }))
            return
        }

        if (field === 'objectives') {
            // single objective selection - keep objectivesArray for DB
            setFormData((prev) => ({ ...prev, objectives: value, objectivesArray: [value] }))
            return
        }

        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
        return num.toString()
    }

    const removeFile = (type: 'brandAssets' | 'referenceImages', index: number) => {
        if (type === 'brandAssets') {
            setBrandAssets((prev) => prev.filter((_, i) => i !== index))
        } else {
            setReferenceImages((prev) => prev.filter((_, i) => i !== index))
        }
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        baseLogger('BRAND-OPERATIONS', 'WillSubmitCampaignDetails')

        if (!paymentBreakdown) {
            toast.error('Missing Budget Calculation', { description: 'Please calculate the budget before submitting.' })
            return
        }

        setLoading(true)
        setProgressState('uploading-assets') // START: Initial progress state
        setError('')

        try {
            baseLogger('BRAND-OPERATIONS', 'WillGetAuthenticatedUser')

            const {
                data: { user },
                error: userError,
            } = await supabaseClient.auth.getUser()

            if (userError || !user) throw new Error('Brand not authenticated')

            baseLogger('BRAND-OPERATIONS', 'DidFindAuthenticatedUser')

            // Filter out empty requirements
            let filteredRequirements = (formData.requirementsText || []).filter((req) => req.trim() !== '')

            // Fallback: if no free-text requirements provided, use the checkbox content requirements
            if (
                filteredRequirements.length === 0 &&
                formData.contentRequirements &&
                formData.contentRequirements.length > 0
            ) {
                filteredRequirements = formData.contentRequirements
            }

            if (filteredRequirements.length === 0) {
                throw new Error('At least one requirement is needed')
            }
            baseLogger('BRAND-OPERATIONS', 'WillBeginUploadingAssets')

            let brandAssetsData: any[] = []
            let referenceImagesData: any[] = []
            let brandGuidelinesData: any = null
            // REQUESTED: Brand Cover Image upload setup
            let coverImageUrl: string | null = null

            // --- ASSET UPLOADS ---
            if (brandAssets.length > 0) {
                baseLogger('BRAND-OPERATIONS', 'WillUploadAssets')
                // uploadFilesToStorage handles video/image type detection now
                brandAssetsData = await uploadFilesToStorage(brandAssets, 'brand-assets')
            }

            if (referenceImages.length > 0) {
                baseLogger('BRAND-OPERATIONS', 'WillUploadReferenceImages')
                referenceImagesData = await uploadFilesToStorage(referenceImages, 'reference-images')
            }

            // REQUESTED: Brand Cover Image Upload
            if (brandCoverImage) {
                baseLogger('BRAND-OPERATIONS', 'WillUploadBrandCoverImage')
                const fileName = `${Date.now()}_${brandCoverImage.name}`
                const filePath = `brand-covers/${fileName}`

                const { error: coverImageError } = await supabaseClient.storage
                    .from('campaign-assets')
                    .upload(filePath, brandCoverImage)

                if (coverImageError) throw coverImageError

                const {
                    data: { publicUrl },
                } = supabaseClient.storage.from('campaign-assets').getPublicUrl(filePath)

                coverImageUrl = publicUrl
                setFormData((prev) => ({ ...prev, coverImageUrl: publicUrl })) // Store URL in local state
            }

            if (brandGuidelines) {
                baseLogger('BRAND-OPERATIONS', 'WillUploadBrandGuidelines')
                const fileName = `${Date.now()}_${brandGuidelines.name}`
                const filePath = `brand-guidelines/${fileName}`

                const { data: guidelinesUpload, error: guidelinesError } = await supabaseClient.storage
                    .from('campaign-assets')
                    .upload(filePath, brandGuidelines)

                if (guidelinesError) throw guidelinesError

                baseLogger('BRAND-OPERATIONS', 'DidUploadBrandGuidelines')

                const {
                    data: { publicUrl },
                } = supabaseClient.storage.from('campaign-assets').getPublicUrl(filePath)

                brandGuidelinesData = {
                    name: brandGuidelines.name,
                    url: publicUrl,
                    type: brandGuidelines.type,
                    size: brandGuidelines.size,
                    media_type: 'document', // Guidelines are a document
                }
            }

            const assets = [
                ...brandAssetsData.map((asset) => ({ ...asset, category: 'brand_asset' })),
                ...referenceImagesData.map((asset) => ({ ...asset, category: 'reference_image' })),
                ...(brandGuidelinesData ? [{ ...brandGuidelinesData, category: 'brand_guidelines' }] : []),
            ]

            // Update state before DB insertion
            setProgressState('inserting-data')
            baseLogger('BRAND-OPERATIONS', 'WillCreateAndInsertCampaignForBrand')

            // convert countries string to array
            const targetCountries = (formData.countries || '')
                .split(',')
                .map((c) => c.trim())
                .filter((c) => c.length > 0)

            const { data: campaignData, error: campaignError } = await supabaseClient
                .from('campaigns')
                .insert([
                    {
                        name: formData.title,
                        description: formData.description,
                        // Using ALIGNED formData fields for budget/payout
                        budget: formData.budget,
                        payout: formData.payout || null,
                        timeline: formData.timeline || null,
                        requirements: filteredRequirements,
                        objectives: formData.objectivesArray,
                        status: 'inreview',
                        created_by: user.id,
                        assets: assets,
                        // new fields saved to DB
                        additional_information: formData.information || null,
                        dos: formData.dos || null,
                        donts: formData.donts || null,
                        target_countries: targetCountries,

                        /**
                         * Payment Details
                         */

                        num_creators: formData.numCreators ?? null,
                        max_pay: formData.maxPay || null,
                        flat_fee: formData.flatFee || null,

                        /**
                         * Cover Image
                         */
                        cover_image_url: coverImageUrl,
                        max_submissions: formData.max_submissions,
                    },
                ])
                .select()
                .single()

            if (campaignError) {
                baseLogger('BRAND-OPERATIONS', 'DidFailToCreateTheCampaign')
                throw new Error(campaignError.message)
            }

            baseLogger('BRAND-OPERATIONS', 'DidCreateAndInsertCampaign')

            // --- ADMIN NOTIFICATION ---
            setProgressState('notifying-admin')

            toast.success('Campaign Successfully Created', {
                description: 'An invoice will be sent to your email once the campaign has been reviewed.',
            })

            addNotificationToTheAdmin({
                id: user.id,
                message: `(NEW-CAMPAIGN) ${formData.title} from Brand`,
                source: 'brand',
            })

            setProgressState('complete') // FINAL State

            // redirect
            if (campaignData && campaignData.id) router.push(`/main/brand/campaigns`)
        } catch (err) {
            console.error('Error creating campaign:', err)
            setError(err instanceof Error ? err.message : 'Failed to create campaign')
            setProgressState('error') // Set error state
        } finally {
            setLoading(false)
        }
    }

    // simple helpers for downloadable previews
    const getPreviewUrlForFile = (type: 'brand' | 'ref' | 'guidelines', index: number, name?: string) => {
        if (type === 'guidelines' && name) return assetUrls[`guidelines-${name}`] || ''
        if (type === 'brand') return assetUrls[`brand-${index}-${brandAssets[index]?.name}`] || ''
        return assetUrls[`ref-${index}-${referenceImages[index]?.name}`] || ''
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white mt-2">
            <h1 className="text-3xl font-semibold text-gray-900 mb-8">New Campaign Brief</h1>

            <form onSubmit={handleSubmit}>
                {/* Campaign Title */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Title (Max 60 characters)
                    </label>
                    <input
                        type="text"
                        placeholder="Enter campaign title"
                        maxLength={60}
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-4 py-3 border border-[#e6626227] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        SEO Suggestion: Include keywords related to your product or service.
                    </p>
                </div>

                {/* Campaign Details: add budget/payout/timeline from older file */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                        <select
                            value={formData.timeline}
                            onChange={(e) => handleInputChange('timeline', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="1 week">1 Week</option>
                            <option value="2 weeks">2 Weeks</option>
                            <option value="1 month">1 Month</option>
                            <option value="2 months">2 Months</option>
                            <option value="3 months">3 Months</option>
                            <option value="flexible">Flexible</option>
                        </select>
                    </div>
                </div>

                {/* Campaign Description */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Description</label>
                    <textarea
                        rows={6}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-4 py-3 border border-[#e6626227] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        required
                    />
                </div>

                {/* --- Media Uploads (Updated) --- */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Uploads</h2>

                    {/* REQUESTED: Brand Cover Image Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Brand Cover Image (Optional)
                        </label>
                        <div
                            {...getCoverImageRootProps()}
                            className="border-2 border-dashed border-[#e6626227] rounded-lg p-8 text-center cursor-pointer"
                        >
                            <input {...getCoverImageInputProps()} />
                            {brandCoverImage ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <p className="text-gray-900 font-medium">✅ {brandCoverImage.name}</p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setBrandCoverImage(null)
                                        }}
                                        className="text-[#e85c51] hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <p className="text-gray-500">Drag and drop a single **cover image** (JPG/PNG)</p>
                            )}
                        </div>
                        {brandCoverImage && (
                            <p className="text-xs text-gray-500 mt-2">
                                Tip: This image will be the primary visual for your campaign listing.
                            </p>
                        )}
                    </div>

                    {/* Reference Images */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reference Images</label>
                        <div
                            {...getReferenceImagesRootProps()}
                            className="border-2 border-dashed border-[#e6626227] rounded-lg p-8 text-center cursor-pointer"
                        >
                            <input {...getReferenceImagesInputProps()} />
                            <p className="text-gray-500">Drag and drop images here</p>
                        </div>

                        {referenceImages.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {referenceImages.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-gray-100 p-2 rounded"
                                    >
                                        <span className="text-sm text-gray-700">{file.name}</span>
                                        <div className="flex items-center space-x-2">
                                            <a
                                                href={getPreviewUrlForFile('ref', index)}
                                                download={file.name}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                Download
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => removeFile('referenceImages', index)}
                                                className="text-[#e85c51] hover:text-red-800 text-xs"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Brand Assets (Now includes Video support) */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Brand Assets (Images **and Videos**)
                        </label>
                        <div
                            {...getBrandAssetsRootProps()}
                            className="border-2 border-dashed border-[#e6626227] rounded-lg p-8 text-center cursor-pointer"
                        >
                            <input {...getBrandAssetsInputProps()} />
                            <p className="text-gray-500">Drag and drop brand assets here</p>
                        </div>

                        {brandAssets.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {brandAssets.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-gray-100 p-2 rounded"
                                    >
                                        <span className="text-sm text-gray-700 flex items-center">
                                            {file.type.startsWith('video/') ? (
                                                <Video className="w-4 h-4 mr-1 text-blue-500" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 mr-1 text-green-500" />
                                            )}
                                            {file.name}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <a
                                                href={getPreviewUrlForFile('brand', index)}
                                                download={file.name}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                Download
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => removeFile('brandAssets', index)}
                                                className="text-[#e85c51] hover:text-red-800 text-xs"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Brand Guidelines
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Brand Guidelines (PDF/DOCX)
                        </label>
                        <div
                            {...getBrandGuidelinesRootProps()}
                            className="border-2 border-dashed border-[#e6626227] rounded-lg p-8 text-center cursor-pointer"
                        >
                            <input {...getBrandGuidelinesInputProps()} />
                            {brandGuidelines ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <p className="text-gray-900">{brandGuidelines.name}</p>
                                    <a
                                        href={getPreviewUrlForFile('guidelines', 0, brandGuidelines.name)}
                                        download={brandGuidelines.name}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Download
                                    </a>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setBrandGuidelines(null)
                                        }}
                                        className="text-[#e85c51] hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <p className="text-gray-500">Drag and drop PDF or DOCX here</p>
                            )}
                        </div>
                    </div> */}
                </div>
                {/* --- End Media Uploads --- */}

                {/* Additional Information */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Information (Key instructions, contact, etc.)
                    </label>
                    <textarea
                        rows={4}
                        placeholder="Any other details the creators or admin should know."
                        value={formData.information}
                        onChange={(e) => handleInputChange('information', e.target.value)}
                        className="w-full px-4 py-3 border border-[#e6626227] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Dos and Don'ts */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DosDontsList
                        title="Content Dos (What to include)"
                        value={formData.dos || ''}
                        onChange={(v) => handleInputChange('dos', v)}
                        placeholder="1. Use our new logo in the corner.\n2. Mention the discount code 'GOHEZA20' clearly.\n3. Keep video under 60 seconds."
                    />
                    <DosDontsList
                        title="Content Don'ts (What to avoid)"
                        value={formData.donts || ''}
                        onChange={(v) => handleInputChange('donts', v)}
                        placeholder="1. Do not mention competitor brand X.\n2. Do not use background music with explicit lyrics.\n3. Do not show the product package."
                    />
                </div>

                {/* --- Views and Budget Calculator (Implemented as requested) --- */}
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Views & Budget Calculator</h2>
                <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Number of Creators Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Creators</label>
                            <input
                                type="number"
                                min="30"
                                placeholder="e.g., 30"
                                value={numCreators === 0 ? '' : numCreators}
                                onChange={(e) => setNumCreators(e.target.value === '' ? 0 : parseInt(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                required
                            />
                        </div>

                        {/* Max Payout Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Payout per Creator ($)
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                    $
                                </span>
                                <input
                                    type="number"
                                    min="70"
                                    placeholder="e.g., 70"
                                    value={maxPayout === 0 ? '' : maxPayout}
                                    onChange={(e) => setMaxPayout(e.target.value === '' ? 0 : parseInt(e.target.value))}
                                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Flat Fee Input (Optional) */}
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Flat Fee for ALL Creators ($) (Optional)
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                    $
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 500 (for product cost, etc.)"
                                    value={flatFee === 0 ? '' : flatFee}
                                    onChange={(e) => setFlatFee(parseInt(e.target.value) || 0)}
                                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handlePaymentCalculate}
                        className="w-full py-3 bg-[#e85c51] text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                        disabled={loading || progressState === 'calculating'}
                    >
                        <Wallet className="w-5 h-5" />
                        <span>Calculate Total Budget</span>
                    </button>

                    {paymentBreakdown && (
                        <div className="mt-4 p-4 bg-white border border-green-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-700 mb-2">Budget Breakdown</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                <p>Creator Payout Total:</p>
                                <p className="font-semibold text-right">
                                    ${paymentBreakdown.creatorPayoutTotal.toLocaleString()}
                                </p>
                                <p>
                                    Goheza Platform Fee (
                                    {Math.round(
                                        (paymentBreakdown.platformFee / paymentBreakdown.creatorPayoutTotal) * 100
                                    )}
                                    %):
                                </p>
                                <p className="font-semibold text-right">
                                    ${paymentBreakdown.platformFee.toLocaleString()}
                                </p>
                                <p className="pt-2 font-bold text-base border-t border-gray-300">
                                    Max Payment Per Creator:
                                </p>
                                <p className="pt-2 font-bold text-base text-right border-t border-gray-300 text-[#e85c51]">
                                    ${paymentBreakdown.perCreatorTotal.toLocaleString()}
                                </p>
                                <p className="pt-2 font-bold text-base border-t border-gray-300">Estimated Views:</p>
                                <p className="pt-2 font-bold text-base text-right border-t border-gray-300 text-[#e85c51]">
                                    {paymentBreakdown.totalViews.toLocaleString()}
                                </p>
                                <p className="pt-2 font-bold text-base border-t border-gray-300">
                                    Total Brand Payment:
                                </p>
                                <p className="pt-2 font-bold text-base text-right border-t border-gray-300 text-[#e85c51]">
                                    ${paymentBreakdown.brandTotalPay.toLocaleString()}
                                </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                This total will be set as the **Campaign Budget** in your brief.
                            </p>
                        </div>
                    )}
                    {paymentError && <p className="mt-4 text-sm text-red-600">Error: {paymentError}</p>}
                </div>
                {/* --- End Views and Budget Calculator --- */}

                {/* Form Progress and Submission */}
                <div className="border-t border-gray-200 pt-6">
                    {progressState !== 'idle' && progressState !== 'calculating' && (
                        <div className="mb-6 space-y-3">
                            <ProgressStep
                                label="Upload Assets"
                                state={getProgressStatus('uploading-assets', progressState)}
                                current={progressState}
                            />
                            <ProgressStep
                                label="Save Campaign Data"
                                state={getProgressStatus('inserting-data', progressState)}
                                current={progressState}
                            />
                            <ProgressStep
                                label="Notify Admin"
                                state={getProgressStatus('notifying-admin', progressState)}
                                current={progressState}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
                            <p className="font-semibold">Submission Error:</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 bg-[#e85c51] text-white font-bold text-lg rounded-lg shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        disabled={loading || progressState !== 'idle' || !paymentBreakdown}
                    >
                        {getButtonText(progressState)}
                    </button>

                    {progressState === 'complete' && (
                        <div className="mt-3 text-center text-green-600 font-medium">
                            Redirecting you to your new campaign in a moment...
                        </div>
                    )}
                </div>
            </form>
        </div>
    )
}

export default CampaignBriefForm
