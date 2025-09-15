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

interface CampaignFormData {
    title: string
    description: string
    objectives: string // single selected objective (keeps newer UI behavior)
    objectivesArray: string[] // for DB compatibility (older file expected array)
    contentRequirements: string[]
    qualityStandard: string
    estimatedViews: number
    totalBudget: number
    creatorsPerMillion: number
    ratePer1K: number
    // fields pulled from older component
    budget?: string // string representation used for DB (e.g., "$5,000")
    payout?: string
    timeline?: string
    requirementsText?: string[] // free-form requirements list
}

const CampaignBriefForm: React.FC = () => {
    const router = useRouter()

    const [formData, setFormData] = useState<CampaignFormData>({
        title: '',
        description: '',
        objectives: 'increase-brand-awareness',
        objectivesArray: ['increase-brand-awareness'],
        contentRequirements: ['video-ad', 'social-media-posts'],
        qualityStandard: 'premium',
        estimatedViews: 1000000,
        totalBudget: 1500,
        creatorsPerMillion: 20,
        ratePer1K: 3.0,
        budget: '$1,500',
        payout: '$500',
        timeline: '1 month',
        requirementsText: [''],
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
        Object.values(assetUrls).forEach((u) => URL.revokeObjectURL(u))
        setAssetUrls(urls)

        // cleanup when component unmounts
        return () => {
            Object.values(urls).forEach((u) => URL.revokeObjectURL(u))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [brandAssets, referenceImages, brandGuidelines])

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

    const renderCalendar = (monthIndex: number) => {
        const month = months[monthIndex]
        const daysInMonth = month.days
        const firstDay = monthIndex === 0 ? 1 : 4 // July 1st is Monday (1), August 1st is Thursday (4)

        const days = []

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8"></div>)
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push(
                <div
                    key={day}
                    className="h-8 flex items-center justify-center text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                    {day}
                </div>
            )
        }

        return days
    }

    // requirement helpers (from older file)
    const handleRequirementChange = (index: number, value: string) => {
        const newRequirements = [...(formData.requirementsText || [])]
        newRequirements[index] = value
        setFormData((prev) => ({ ...prev, requirementsText: newRequirements }))
    }

    const addRequirement = () => {
        setFormData((prev) => ({ ...prev, requirementsText: [...(prev.requirementsText || ['']), ''] }))
    }

    const removeRequirement = (index: number) => {
        if ((formData.requirementsText || []).length > 1) {
            setFormData((prev) => ({
                ...prev,
                requirementsText: prev.requirementsText!.filter((_, i) => i !== index),
            }))
        }
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
                        quality_standard: formData.qualityStandard,
                        status: 'inreview',
                        created_by: user.id,
                        assets: assets,
                     
                    },
                ])
                .select()
                .single()

            if (campaignError) {
                baseLogger('BRAND-OPERATIONS', 'DidFailToCreateTheCampaign')
                throw new Error(campaignError.message)
            }

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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Creator Payout</label>
                    <input
                        type="text"
                        placeholder="$500"
                        value={formData.payout}
                        onChange={(e) => handleInputChange('payout', e.target.value)}
                        className="w-full px-4 py-3 bg-[#e6626227] border border-[#e6626227] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium  mb-2">Budget Display</label>
                    <input
                        type="text"
                        value={formData.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
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
                                            className="text-red-600 hover:text-red-800 text-xs"
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
                                            className="text-red-600 hover:text-red-800 text-xs"
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
                                    className="text-red-600 hover:text-red-800 text-sm"
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
                                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
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

            {/* Quality Standards */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quality Standards</h2>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => handleInputChange('qualityStandard', 'premium')}
                        className={`px-4 py-2 text-sm font-medium ${
                            formData.qualityStandard === 'premium'
                                ? 'text-red-600 border-b-2 border-red-600'
                                : 'text-gray-600 hover:text-red-600'
                        }`}
                    >
                        Premium
                    </button>
                    <button
                        onClick={() => handleInputChange('qualityStandard', 'standard')}
                        className={`px-4 py-2 text-sm font-medium ${
                            formData.qualityStandard === 'standard'
                                ? 'text-red-600 border-b-2 border-red-600'
                                : 'text-gray-600 hover:text-red-600'
                        }`}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => handleInputChange('qualityStandard', 'basic')}
                        className={`px-4 py-2 text-sm font-medium ${
                            formData.qualityStandard === 'basic'
                                ? 'text-red-600 border-b-2 border-red-600'
                                : 'text-gray-600 hover:text-red-600'
                        }`}
                    >
                        Basic
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="font-medium text-gray-900 mb-1">Premium Example</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            High-quality video ad with professional editing and voiceover.
                        </p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <p className="text-gray-500 text-sm">Drag and drop images here</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-900 mb-1">Standard Example</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Well-produced video ad with clear visuals and audio.
                        </p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <p className="text-gray-500 text-sm">Drag and drop images here</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-900 mb-1">Basic Example</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Simple video ad with basic editing and minimal production.
                        </p>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <p className="text-gray-500 text-sm">Drag and drop images here</p>
                        </div>
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
                        <style jsx>{`
                            input[type='range']::-webkit-slider-thumb {
                                appearance: none;
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                background: #dc2626;
                                cursor: pointer;
                                border: 2px solid white;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            }
                            input[type='range']::-moz-range-thumb {
                                width: 20px;
                                height: 20px;
                                border-radius: 50%;
                                background: #dc2626;
                                cursor: pointer;
                                border: 2px solid white;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            }
                        `}</style>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1M</span>
                            <span>5.5M</span>
                            <span>10M</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-red-600" />
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
                            <Users className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Creators per 1M views</p>
                            <p className="text-lg font-semibold text-gray-900">{formData.creatorsPerMillion}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Rate per 1K views</p>
                            <p className="text-lg font-semibold text-gray-900">${formData.ratePer1K.toFixed(1)}</p>
                        </div>
                    </div>
                </div>

                {/* Budget Summary */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Summary</h3>
                    <p className="text-gray-600 mb-4">
                        {formatNumber(formData.estimatedViews)} views | {formData.creatorsPerMillion} creators | $
                        {formData.totalBudget.toLocaleString()} budget
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => {
                                /* keep this UI-only */
                            }}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Save Budget
                        </button>
                        <button
                            onClick={() => {
                                /* payment flow not in scope */
                            }}
                            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Campaign Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                    {loading ? 'Creating Campaign...' : 'Create Campaign'}
                </button>
            </div>

            {/* Error display */}
            {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
        </div>
    )
}

export default CampaignBriefForm
