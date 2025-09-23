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
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { baseLogger } from '@/lib/logger'
import { calculateGohezaPayment } from '@/lib/ats/payment-calculator'
import { toast } from 'sonner'
import { addNotificationToTheAdmin } from '@/lib/ats/main/adminNotifications'

interface CampaignFormData {
    title: string
    description: string
    objectives: string // single selected objective (keeps newer UI behavior)
    objectivesArray: string[] // for DB compatibility (older file expected array)
    contentRequirements: string[]
    estimatedViews: number
    totalBudget: number
    creatorsPerMillion: number
    ratePer1K: number
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
    flatFee?: string
}

interface PaymentBreakdown {
    numCreators: number
    maxPayout: number
    flatFee: number
    creatorPayoutTotal: number
    platformFee: number
    brandTotalPay: number
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
        creatorsPerMillion: 20,
        ratePer1K: 3.0,
        budget: '$1,500',
        payout: '$500',
        timeline: '1 month',
        requirementsText: [''],

        // defaults for new fields
        information: '',
        dos: '',
        donts: '',
        countries: '',
        numCreators: 1,
        maxPay: '',
        flatFee: '',
    })

    const [currentMonth, setCurrentMonth] = useState(0) // 0 = July 2024, 1 = August 2024

    const months = [
        { name: 'July 2024', days: 31 },
        { name: 'August 2024', days: 31 },
    ]

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    // File states from the older component
    const [brandAssets, setBrandAssets] = useState<File[]>([])
    const [referenceImages, setReferenceImages] = useState<File[]>([])
    const [brandGuidelines, setBrandGuidelines] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [numCreators, setNumCreators] = useState(50)
    const [maxPayout, setMaxPayout] = useState(30)
    const [flatFee, setFlatFee] = useState(0)
    const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null)
    const [paymentError, setPaymentError] = useState<string | null>(null)

    // Local previews (object URLs) so users can download/view before upload
    const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})

    // Dropzone handlers
    const onDropBrandAssets = useCallback((acceptedFiles: File[]) => {
        setBrandAssets((prev) => [...prev, ...acceptedFiles])
    }, [])

    const onDropReferenceImages = useCallback((acceptedFiles: File[]) => {
        setReferenceImages((prev) => [...prev, ...acceptedFiles])
    }, [])

    const onDropBrandGuidelines = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) setBrandGuidelines(acceptedFiles[0])
    }, [])

    const { getRootProps: getBrandAssetsRootProps, getInputProps: getBrandAssetsInputProps } = useDropzone({
        onDrop: onDropBrandAssets,
        accept: { 'image/*': [] },
        multiple: true,
    })

    const { getRootProps: getReferenceImagesRootProps, getInputProps: getReferenceImagesInputProps } = useDropzone({
        onDrop: onDropReferenceImages,
        accept: { 'image/*': [] },
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

    useEffect(() => {
        // generate object URLs for easy download/preview and clean them up
        const urls: Record<string, string> = {}

        brandAssets.forEach((f, i) => {
            const key = `brand-${i}-${f.name}`
            urls[key] = URL.createObjectURL(f)
        })

        referenceImages.forEach((f, i) => {
            const key = `ref-${i}-${f.name}`
            urls[key] = URL.createObjectURL(f)
        })

        if (brandGuidelines) {
            const key = `guidelines-${brandGuidelines.name}`
            urls[key] = URL.createObjectURL(brandGuidelines)
        }

        // revoke previous urls
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
    }, [brandAssets, referenceImages, brandGuidelines])

    const handlePaymentCalculate = () => {
        try {
            const result = calculateGohezaPayment(numCreators, maxPayout, flatFee)
            setPaymentBreakdown(result)
            setPaymentError(null)
        } catch (err: any) {
            setPaymentBreakdown(null)
            setPaymentError(err.message)
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

    const handleContentRequirementToggle = (requirement: string) => {
        setFormData((prev) => ({
            ...prev,
            contentRequirements: prev.contentRequirements.includes(requirement)
                ? prev.contentRequirements.filter((r) => r !== requirement)
                : [...prev.contentRequirements, requirement],
        }))
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

    const uploadFilesToStorage = async (files: File[], folder: string) => {
        const uploadPromises = files.map(async (file) => {
            const fileName = `${Date.now()}_${file.name}`
            const filePath = `${folder}/${fileName}`

            const { data, error } = await supabaseClient.storage.from('campaign-assets').upload(filePath, file)

            if (error) throw error

            const {
                data: { publicUrl },
            } = supabaseClient.storage.from('campaign-assets').getPublicUrl(filePath)

            return {
                name: file.name,
                url: publicUrl,
                type: file.type,
                size: file.size,
            }
        })

        return Promise.all(uploadPromises)
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        baseLogger('BRAND-OPERATIONS', 'WillSubmitCampaignDetails')

        setLoading(true)
        setError('')

        try {
            baseLogger('BRAND-OPERATIONS', 'WillGetAuthenticatedUser')

            const {
                data: { user },
                error: userError,
            } = await supabaseClient.auth.getUser()

            if (userError || !user) throw new Error('Brand not authenticated')

            baseLogger('BRAND-OPERATIONS', 'DidFindAuthenticatedUser')

            // Filter out empty requirements (from free text requirements)
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

            if (brandAssets.length > 0) {
                baseLogger('BRAND-OPERATIONS', 'WillUploadAssets')
                brandAssetsData = await uploadFilesToStorage(brandAssets, 'brand-assets')
                baseLogger('BRAND-OPERATIONS', 'DidUploadAssets')
            }

            if (referenceImages.length > 0) {
                baseLogger('BRAND-OPERATIONS', 'WillUploadReferenceImages')
                referenceImagesData = await uploadFilesToStorage(referenceImages, 'reference-images')
                baseLogger('BRAND-OPERATIONS', 'DidUploadReferenceImages')
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
                }
            }

            const assets = [
                ...brandAssetsData.map((asset) => ({ ...asset, category: 'brand_asset' })),
                ...referenceImagesData.map((asset) => ({ ...asset, category: 'reference_image' })),
                ...(brandGuidelinesData ? [{ ...brandGuidelinesData, category: 'brand_guidelines' }] : []),
            ]

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
                        budget: formData.budget || `$${formData.totalBudget}`,
                        payout: formData.payout || null,
                        timeline: formData.timeline || null,
                        requirements: filteredRequirements,
                        objectives: formData.objectivesArray,
                        estimated_views: formData.estimatedViews,
                        status: 'inreview',
                        created_by: user.id,
                        assets: assets,
                        // new fields saved to DB (naming follows snake_case used earlier)
                        additional_information: formData.information || null,
                        dos: formData.dos || null,
                        donts: formData.donts || null,
                        target_countries: targetCountries,
                        num_creators: formData.numCreators ?? null,
                        max_pay: formData.maxPay || null,
                        flat_fee: formData.flatFee || null,
                    },
                ])
                .select()
                .single()

            if (campaignError) {
                baseLogger('BRAND-OPERATIONS', 'DidFailToCreateTheCampaign')
                throw new Error(campaignError.message)
            }

            baseLogger('BRAND-OPERATIONS', 'DidCreateAndInsertCampaign')

            /**
             * -----------------------------------------------------------------------------------------------------
             *
             *
             * Since the Campaign has been sent, we need yo add on the admin notifications
             *
             */

            toast.success('Campaign Successfully Created', {
                description: 'An invoice will be sent to your email once the campaign has been reviewed.',
            })

            /**
             * Send a message to the Admin about the new campaign that has been posted
             */

            addNotificationToTheAdmin({
                id: user.id,
                message: `(NEW-CAMPAIGN) ${formData.title} from Brand`,
                source: 'brand',
            })

            // redirect
            if (campaignData && campaignData.id) router.push(`/main/brand/campaigns/${campaignData.id}`)
        } catch (err) {
            console.error('Error creating campaign:', err)
            setError(err instanceof Error ? err.message : 'Failed to create campaign')
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
                    className="w-full px-4 py-3 bg-[#e6626227] border border-[#e6626227] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-3  bg-[#e6626227] border border-[#e6626227] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
            </div>

            {/* Additional Information (NEW) */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Additional Information</h2>
                <textarea
                    rows={4}
                    placeholder="Add more context about your campaign (audience, tone, key messages)..."
                    value={formData.information}
                    onChange={(e) => handleInputChange('information', e.target.value)}
                    className="w-full px-4 py-3 bg-[#e6626227] border border-[#e6626227] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                    Optional: Use to give creators more context about the campaign.
                </p>
            </div>

            {/* Media Uploads */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Uploads</h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference Images</label>
                    <div
                        {...getReferenceImagesRootProps()}
                        className="border-2 border-dashed bg-[#e6626227]  border-[#e6626227] rounded-lg p-8 text-center"
                    >
                        <input {...getReferenceImagesInputProps()} />
                        <p className="text-gray-500">Drag and drop images here</p>
                    </div>

                    {referenceImages.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {referenceImages.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
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

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Assets</label>
                    <div
                        {...getBrandAssetsRootProps()}
                        className="border-2 border-dashed bg-[#e6626227]  border-[#e6626227] rounded-lg p-8 text-center"
                    >
                        <input {...getBrandAssetsInputProps()} />
                        <p className="text-gray-500">Drag and drop brand assets here</p>
                    </div>

                    {brandAssets.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {brandAssets.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                                    <span className="text-sm text-gray-700">{file.name}</span>
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

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Guidelines (PDF/DOCX)</label>
                    <div
                        {...getBrandGuidelinesRootProps()}
                        className="border-2 border-dashed bg-[#e6626227]  border-[#e6626227] rounded-lg p-8 text-center"
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
                </div>
            </div>

            {/* Campaign Objectives */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Objectives</h2>

                <div className="space-y-3">
                    {['increase-brand-awareness', 'drive-sales', 'generate-leads'].map((opt) => (
                        <div key={opt} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-5 h-5 mt-0.5">
                                    <input
                                        type="radio"
                                        name="objective"
                                        value={opt}
                                        checked={formData.objectives === opt}
                                        onChange={(e) => handleInputChange('objectives', e.target.value)}
                                        className="w-4 h-4 text-[#e85c51] border-gray-300 focus:ring-red-500"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">
                                        {opt === 'increase-brand-awareness'
                                            ? 'Increase Brand Awareness'
                                            : opt === 'drive-sales'
                                            ? 'Drive Sales'
                                            : 'Generate Leads'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {opt === 'increase-brand-awareness'
                                            ? "Expand your brand's reach and visibility."
                                            : opt === 'drive-sales'
                                            ? 'Boost product sales and revenue.'
                                            : 'Collect potential customer information.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Target Countries (NEW) */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Countries</label>
                    <input
                        type="text"
                        placeholder="e.g. United States, Canada, UK"
                        value={formData.countries}
                        onChange={(e) => handleInputChange('countries', e.target.value)}
                        className="w-full px-4 py-3 bg-[#e6626227] border border-[#e6626227] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">Comma-separated list — used for creator targeting.</p>
                </div>
            </div>

            {/* Content Requirements */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Requirements</h2>

                <div className="space-y-3">
                    {[
                        'video-ad',
                        'social-media-posts',
                        'blog-articles',
                        'email-newsletter',
                        'influencer-collaboration',
                    ].map((req) => (
                        <div key={req} className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id={req}
                                checked={formData.contentRequirements.includes(req)}
                                onChange={() => handleContentRequirementToggle(req)}
                                className="w-4 h-4 text-[#e6626227] bg-[#e6626227] checked:text-[#e6626227]   border-[#e6626227]  rounded focus:ring-[#e6626227]"
                            />
                            <label htmlFor={req} className="text-gray-900">
                                {req
                                    .split('-')
                                    .map((s) => s[0].toUpperCase() + s.slice(1))
                                    .join(' ')}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Prohibited Content */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Prohibited Content</h2>
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-2 bg-gray-200 text-gray-700 rounded-full text-sm">Offensive Language</span>
                    <span className="px-3 py-2 bg-gray-200 text-gray-700 rounded-full text-sm">Misleading Claims</span>
                    <span className="px-3 py-2 bg-gray-200 text-gray-700 rounded-full text-sm">
                        Political Statements
                    </span>
                </div>
            </div>

            {/* Dos and Don'ts (NEW) */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Dos and Don’ts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dos</label>
                        <textarea
                            rows={4}
                            placeholder="List things creators must include (e.g., mention discount code, show product clearly)..."
                            value={formData.dos}
                            onChange={(e) => handleInputChange('dos', e.target.value)}
                            className="w-full px-4 py-3 bg-[#e6626227] border border-[#e6626227] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Don’ts</label>
                        <textarea
                            rows={4}
                            placeholder="List restrictions (e.g., avoid profanity, don’t alter brand logos)..."
                            value={formData.donts}
                            onChange={(e) => handleInputChange('donts', e.target.value)}
                            className="w-full px-4 py-3 bg-[#e6626227] border border-[#e6626227] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Views and Budget Calculator */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Views and Budget Calculator</h2>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Estimated Views</span>
                        <span className="text-sm font-medium text-gray-900">
                            {formatNumber(formData.estimatedViews)}
                        </span>
                    </div>

                    <div className="relative">
                        <input
                            type="range"
                            min="1000000"
                            max="10000000"
                            step="100000"
                            value={formData.estimatedViews}
                            onChange={(e) => handleInputChange('estimatedViews', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Payment Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block mb-1 font-medium">Number of Creators</label>
                        <input
                            type="number"
                            min={50}
                            value={numCreators}
                            onChange={(e) => setNumCreators(Number(e.target.value))}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium">Max Payout per Creator ($)</label>
                        <input
                            type="number"
                            min={30}
                            value={maxPayout}
                            onChange={(e) => setMaxPayout(Number(e.target.value))}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium">Flat Fee per Creator ($, optional)</label>
                        <input
                            type="number"
                            min={0}
                            value={flatFee}
                            onChange={(e) => setFlatFee(Number(e.target.value))}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>

                <button
                    onClick={handlePaymentCalculate}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
                >
                    Calculate Payment
                </button>

                {paymentError && <p className="text-red-500 font-medium mb-3">{paymentError}</p>}

                {paymentBreakdown && (
                    <div className="p-4 bg-gray-50 border rounded mb-6">
                        <p>
                            <strong>Creators Total Payout:</strong> $
                            {paymentBreakdown.creatorPayoutTotal.toLocaleString()}
                        </p>
                        <p>
                            <strong>Platform Fee (30%):</strong> ${paymentBreakdown.platformFee.toLocaleString()}
                        </p>
                        <p>
                            <strong>Total Brand Pay:</strong> ${paymentBreakdown.brandTotalPay.toLocaleString()}
                        </p>
                    </div>
                )}

                {/* Original Budget Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-[#e85c51]" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Budget</p>
                            <p className="text-lg font-semibold text-gray-900">
                                ${formData.totalBudget.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#e85c51]" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Creators per 1M views</p>
                            <p className="text-lg font-semibold text-gray-900">{formData.creatorsPerMillion}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-[#e85c51]" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Rate per 1K views</p>
                            <p className="text-lg font-semibold text-gray-900">${formData.ratePer1K.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Campaign Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-[#e85c51] text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                    Create Campaign
                </button>
            </div>

            {/* Error display */}
            {error && <div className="mt-4 text-sm text-[#e85c51]">{error}</div>}
        </div>
    )
}

export default CampaignBriefForm
