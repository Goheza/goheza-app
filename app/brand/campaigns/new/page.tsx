'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

interface CampaignFormData {
    name: string
    description: string
    budget: string
    payout: string
    timeline: string
    requirements: string[]
    objectives: string[]
    estimatedViews: number
    qualityStandard: 'basic' | 'premium' | 'professional'
}

export default function CreateCampaign() {
    const router = useRouter()

    const [formData, setFormData] = useState<CampaignFormData>({
        name: '',
        description: '',
        budget: '',
        payout: '',
        timeline: '',
        requirements: [''],
        objectives: [],
        estimatedViews: 1000000,
        qualityStandard: 'premium',
    })

    const [brandAssets, setBrandAssets] = useState<File[]>([])
    const [referenceImages, setReferenceImages] = useState<File[]>([])
    const [brandGuidelines, setBrandGuidelines] = useState<File | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')

    const onDropBrandAssets = useCallback((acceptedFiles: File[]) => {
        setBrandAssets((prev) => [...prev, ...acceptedFiles])
    }, [])

    const onDropReferenceImages = useCallback((acceptedFiles: File[]) => {
        setReferenceImages((prev) => [...prev, ...acceptedFiles])
    }, [])

    const onDropBrandGuidelines = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setBrandGuidelines(acceptedFiles[0])
        }
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target

        if (type === 'number') {
            setFormData((prev) => ({
                ...prev,
                [name]: parseInt(value) || 0,
            }))
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }))
        }
    }

    const handleObjectiveChange = (objective: string, checked: boolean) => {
        setFormData((prev) => ({
            ...prev,
            objectives: checked ? [...prev.objectives, objective] : prev.objectives.filter((obj) => obj !== objective),
        }))
    }

    const handleRequirementChange = (index: number, value: string) => {
        const newRequirements = [...formData.requirements]
        newRequirements[index] = value
        setFormData((prev) => ({
            ...prev,
            requirements: newRequirements,
        }))
    }

    const addRequirement = () => {
        setFormData((prev) => ({
            ...prev,
            requirements: [...prev.requirements, ''],
        }))
    }

    const removeRequirement = (index: number) => {
        if (formData.requirements.length > 1) {
            setFormData((prev) => ({
                ...prev,
                requirements: prev.requirements.filter((_, i) => i !== index),
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Get current authenticated user (brand)
            const {
                data: { user },
                error: userError,
            } = await supabaseClient.auth.getUser()

            if (userError || !user) {
                throw new Error('Brand not authenticated')
            }

            // Filter out empty requirements
            const filteredRequirements = formData.requirements.filter((req) => req.trim() !== '')

            if (filteredRequirements.length === 0) {
                throw new Error('At least one requirement is needed')
            }

            // Upload files to storage
            let brandAssetsData: any[] = []
            let referenceImagesData: any[] = []
            let brandGuidelinesData: any = null

            // Upload brand assets
            if (brandAssets.length > 0) {
                brandAssetsData = await uploadFilesToStorage(brandAssets, 'brand-assets')
            }

            // Upload reference images
            if (referenceImages.length > 0) {
                referenceImagesData = await uploadFilesToStorage(referenceImages, 'reference-images')
            }

            // Upload brand guidelines
            if (brandGuidelines) {
                const fileName = `${Date.now()}_${brandGuidelines.name}`
                const filePath = `brand-guidelines/${fileName}`

                const { data: guidelinesUpload, error: guidelinesError } = await supabaseClient.storage
                    .from('campaign-assets')
                    .upload(filePath, brandGuidelines)

                if (guidelinesError) throw guidelinesError

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

            // Prepare assets object for database
            const assets = [
                ...brandAssetsData.map((asset) => ({ ...asset, category: 'brand_asset' })),
                ...referenceImagesData.map((asset) => ({ ...asset, category: 'reference_image' })),
                ...(brandGuidelinesData ? [{ ...brandGuidelinesData, category: 'brand_guidelines' }] : []),
            ]

            // Create new campaign in database
            const { data: campaignData, error: campaignError } = await supabaseClient
                .from('campaigns')
                .insert([
                    {
                        name: formData.name,
                        description: formData.description,
                        budget: formData.budget,
                        payout: formData.payout,
                        timeline: formData.timeline,
                        requirements: filteredRequirements,
                        objectives: formData.objectives,
                        estimated_views: formData.estimatedViews,
                        quality_standard: formData.qualityStandard,
                        status: 'pending',
                        created_by: user.id,
                        assets: assets,
                    },
                ])
                .select()
                .single()

            if (campaignError) {
                throw new Error(campaignError.message)
            }

            // Success - redirect to campaign details
            router.push(`/brand/campaigns/${campaignData.id}`)
        } catch (err) {
            console.error('Error creating campaign:', err)
            setError(err instanceof Error ? err.message : 'Failed to create campaign')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="font-sans p-5 max-w-6xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="mb-4 text-[#E66262] flex items-center"
                >
                    ← Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold mb-2">New Campaign Brief</h1>
                <p className="text-gray-600">Fill out the details below to create a new campaign.</p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Basic Campaign Info */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Campaign Title (Max 60 characters) *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter campaign title"
                                maxLength={60}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-1">
                                Campaign Timeline *
                            </label>
                            <select
                                id="timeline"
                                name="timeline"
                                value={formData.timeline}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select timeline</option>
                                <option value="1 week">1 Week</option>
                                <option value="2 weeks">2 Weeks</option>
                                <option value="1 month">1 Month</option>
                                <option value="2 months">2 Months</option>
                                <option value="3 months">3 Months</option>
                                <option value="flexible">Flexible</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Campaign Description *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Write a detailed description of your campaign"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                                Total Budget *
                            </label>
                            <input
                                id="budget"
                                name="budget"
                                type="text"
                                value={formData.budget}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., $5,000"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="payout" className="block text-sm font-medium text-gray-700 mb-1">
                                Creator Payout *
                            </label>
                            <input
                                id="payout"
                                name="payout"
                                type="text"
                                value={formData.payout}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., $500"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Campaign Requirements */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h2 className="text-xl font-semibold mb-4">Campaign Requirements</h2>

                    {formData.requirements.map((requirement, index) => (
                        <div key={index} className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={requirement}
                                onChange={(e) => handleRequirementChange(index, e.target.value)}
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Requirement ${index + 1}`}
                            />
                            {formData.requirements.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeRequirement(index)}
                                    className="px-3 py-2 text-red-600 hover:text-red-800"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addRequirement}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                        + Add Requirement
                    </button>
                </div>

                {/* Media Uploads Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h2 className="text-xl font-semibold mb-4">Media Uploads</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Reference Images</p>
                            <div
                                {...getReferenceImagesRootProps()}
                                className="border-2 border-dashed rounded-lg p-5 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
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
                                            <button
                                                type="button"
                                                onClick={() => removeFile('referenceImages', index)}
                                                className="text-red-600 hover:text-red-800 text-xs"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Brand Assets</p>
                            <div
                                {...getBrandAssetsRootProps()}
                                className="border-2 border-dashed rounded-lg p-5 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
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
                                            <span className="text-sm text-gray-700">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile('brandAssets', index)}
                                                className="text-red-600 hover:text-red-800 text-xs"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Campaign Objectives Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h2 className="text-xl font-semibold mb-4">Campaign Objectives</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            'Increase Brand Awareness',
                            'Drive Sales',
                            'Generate Leads',
                            'Improve Customer Engagement',
                        ].map((objective) => (
                            <div key={objective} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id={objective}
                                    className="h-4 w-4 rounded text-blue-600 border-gray-300"
                                    checked={formData.objectives.includes(objective)}
                                    onChange={(e) => handleObjectiveChange(objective, e.target.checked)}
                                />
                                <label htmlFor={objective} className="text-gray-700">
                                    {objective}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quality Standards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h2 className="text-xl font-semibold mb-4">Quality Standards</h2>
                    <div className="space-y-3">
                        {[
                            { value: 'basic', label: 'Basic - Standard quality content' },
                            { value: 'premium', label: 'Premium - High-quality, professional content' },
                            { value: 'professional', label: 'Professional - Studio-quality, brand-ready content' },
                        ].map((standard) => (
                            <div key={standard.value} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id={standard.value}
                                    name="qualityStandard"
                                    value={standard.value}
                                    checked={formData.qualityStandard === standard.value}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300"
                                />
                                <label htmlFor={standard.value} className="text-gray-700">
                                    {standard.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Brand Guidelines Upload */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h2 className="text-xl font-semibold mb-4">Brand Guidelines</h2>
                    <div
                        {...getBrandGuidelinesRootProps()}
                        className="border-2 border-dashed rounded-lg p-5 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <input {...getBrandGuidelinesInputProps()} />
                        {brandGuidelines ? (
                            <div className="flex items-center justify-center space-x-2">
                                <p className="text-gray-900">{brandGuidelines.name}</p>
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

                {/* Views and Budget Calculator */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h2 className="text-xl font-semibold mb-4">Campaign Analytics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="estimatedViews" className="block text-sm font-medium text-gray-700 mb-1">
                                Estimated Views
                            </label>
                            <input
                                id="estimatedViews"
                                name="estimatedViews"
                                type="number"
                                value={formData.estimatedViews}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1000"
                            />
                        </div>
                        <div className="flex items-end">
                            <div className="bg-blue-50 p-4 rounded-lg w-full">
                                <p className="text-sm text-gray-600">Estimated Cost Per View</p>
                                <p className="text-lg font-semibold text-blue-600">
                                    $
                                    {formData.budget && formData.estimatedViews
                                        ? (
                                              (parseFloat(formData.budget.replace(/[$,]/g, '')) /
                                                  formData.estimatedViews) *
                                              1000
                                          ).toFixed(3)
                                        : '0.000'}{' '}
                                    per 1K views
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#E66262] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#f57e7e] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating Campaign...' : 'Create Campaign'}
                </button>
            </form>
        </div>
    )
}
