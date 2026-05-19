'use client'
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { addNotificationToTheAdmin } from '@/lib/appServiceData/adminNotifications'
import { uploadFilesToStorage } from '@/lib/appServiceData/services/uploadFilesToStorage'
import {
    Image as ImageIcon,
    Video,
    TrendingUp,
    TrendingDown,
    Users,
    Eye,
    DollarSign,
    Wallet,
    Globe,
    Clock3,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react'
import DosDontsList from '@/components/workspace/pages/brand/DosDonts/DosDonts'

// ─────────────────────────────────────────────
// CONSTANTS — fixed rules, never user-editable
// ─────────────────────────────────────────────
const COST_PER_1K_VIEWS = 10_000 // UGX — fixed platform rule
const VIEWS_DIVISOR = 10 // requiredViews = totalBudget / 10

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface ViewsCampaignFormData {
    title: string
    description: string
    information?: string
    dos?: string
    donts?: string
    countries?: string
    timeline?: string
    requirementsText?: string[]
    // Views campaign logic
    minCreators: number
    totalBudget: number
    requiredViews: number
    // cover image
    coverImageUrl?: string
}

interface ViewsPaymentSummary {
    totalBudget: number
    minCreators: number
    costPer1kViews: number
    requiredViews: number
    total1kViewUnits: number
}

type ProgressState =
    | 'idle'
    | 'calculating'
    | 'uploading-assets'
    | 'inserting-data'
    | 'notifying-admin'
    | 'complete'
    | 'error'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}000` : n.toLocaleString()

const computeBudgetState = (totalBudgetPool: number, totalViewsAccumulated: number, requiredViews: number) => {
    // Uses the fixed rate: every 1k views costs COST_PER_1K_VIEWS UGX
    const units1k = totalViewsAccumulated / 1000
    const creatorEarnings = units1k * COST_PER_1K_VIEWS
    const remainingBudget = Math.max(totalBudgetPool - creatorEarnings, 0)
    const spentBudget = totalBudgetPool - remainingBudget
    const reductionPercent = totalBudgetPool > 0 ? Math.min((spentBudget / totalBudgetPool) * 100, 100) : 0
    const remainingPercent = Math.max(100 - reductionPercent, 0)
    const viewProgressPercent = requiredViews > 0 ? Math.min((totalViewsAccumulated / requiredViews) * 100, 100) : 0
    return {
        creatorEarnings,
        remainingBudget,
        spentBudget,
        reductionPercent,
        remainingPercent,
        viewProgressPercent,
        isExhausted: remainingBudget <= 0,
        isNearlyExhausted: remainingPercent <= 20 && remainingPercent > 0,
        isHealthy: remainingPercent > 50,
    }
}

/**
 * Fixed formula:
 *   requiredViews = totalBudget / VIEWS_DIVISOR  (budget ÷ 10)
 *   costPer1kViews is always COST_PER_1K_VIEWS   (10,000 UGX)
 */
const derivePaymentSummary = (totalBudget: number, minCreators: number): ViewsPaymentSummary => {
    const requiredViews = Math.floor(totalBudget / VIEWS_DIVISOR)
    const total1kViewUnits = requiredViews / 1000
    return {
        totalBudget,
        minCreators,
        costPer1kViews: COST_PER_1K_VIEWS,
        requiredViews,
        total1kViewUnits,
    }
}

// ─────────────────────────────────────────────
// BUDGET PREVIEW COMPONENT
// ─────────────────────────────────────────────
interface BudgetMeterPreviewProps {
    totalBudgetPool: number
    requiredViews: number
    minCreators: number
}

const BudgetMeterPreview: React.FC<BudgetMeterPreviewProps> = ({ totalBudgetPool, requiredViews, minCreators }) => {
    const state = useMemo(() => computeBudgetState(totalBudgetPool, 0, requiredViews), [totalBudgetPool, requiredViews])

    return (
        <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e85c51] animate-pulse" />
                <p className="text-xs uppercase tracking-wide font-semibold text-red-600">Live Budget Pool Preview</p>
            </div>

            <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-[#e85c51]" />
                            Budget Pool Meter
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Budget reduces dynamically as creators accumulate verified views.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{state.remainingPercent.toFixed(0)}%</p>
                        <p className="text-xs text-gray-400">remaining</p>
                    </div>
                </div>

                <div className="w-full h-4 rounded-full bg-green-100 overflow-hidden mb-4">
                    <div
                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                        style={{ width: `${state.remainingPercent}%` }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-gray-400 text-xs">Budget Pool</p>
                        <p className="font-bold text-gray-900 mt-1">UGX {fmt(totalBudgetPool)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                        <p className="text-[#e85c51] text-xs">Cost Per 1k Views</p>
                        {/* Display only — fixed at 10,000 UGX */}
                        <p className="font-bold text-red-700 mt-1">UGX {fmt(COST_PER_1K_VIEWS)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-blue-500 text-xs">Views To Exhaust Pool</p>
                        <p className="font-bold text-blue-700 mt-1">{fmt(requiredViews)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Minimum Creators</p>
                        <Users className="w-4 h-4 text-[#e85c51]" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{minCreators}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Payout Logic</p>
                        <Wallet className="w-4 h-4 text-[#e85c51]" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">First Come First Serve</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Pool State</p>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-sm font-semibold text-green-600">Healthy</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Creator Competition</p>
                        <Eye className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">View Based</p>
                </div>
            </div>

            {/* What creators will see */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-700 mb-2">What creators will see:</p>
                <ul className="space-y-1 text-xs text-gray-600 list-disc list-inside">
                    <li>
                        Total views needed: <strong>{fmt(requiredViews)}</strong>{' '}
                        {/* <span className="text-gray-400">(budget ÷ 10)</span> */}
                    </li>
                    <li>
                        Pay per 1,000 views: <strong>UGX {fmt(COST_PER_1K_VIEWS)}</strong>
                    </li>
                    <li>Remaining budget pool decreases live as views accumulate.</li>
                    <li>Creators who gain views first are paid first.</li>
                </ul>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const ViewsBasedCampaignForm: React.FC = () => {
    const router = useRouter()

    const [formData, setFormData] = useState<ViewsCampaignFormData>({
        title: '',
        description: '',
        information: '',
        dos: '',
        donts: '',
        countries: '',
        timeline: '1 month',
        requirementsText: [''],
        minCreators: 40,
        totalBudget: 0,
        requiredViews: 0,
        // costPer1kViews removed — it's always COST_PER_1K_VIEWS
    })

    const [brandCoverImage, setBrandCoverImage] = useState<File | null>(null)
    const [brandAssets, setBrandAssets] = useState<File[]>([])
    const [referenceImages, setReferenceImages] = useState<File[]>([])
    const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})
    const [paymentSummary, setPaymentSummary] = useState<ViewsPaymentSummary | null>(null)
    const [summaryCalculated, setSummaryCalculated] = useState(false)
    const [progressState, setProgressState] = useState<ProgressState>('idle')
    const [loading, setLoading] = useState(false)
    const prevUrlsRef = React.useRef<Record<string, string>>({})

    const [error, setError] = useState('')

    // ─────────────────────────────────────────────
    // DROPZONES
    // ─────────────────────────────────────────────
    const onDropCover = useCallback((files: File[]) => {
        if (files.length > 0) setBrandCoverImage(files[0])
    }, [])
    const onDropAssets = useCallback((files: File[]) => {
        setBrandAssets((prev) => [...prev, ...files])
    }, [])
    const onDropReference = useCallback((files: File[]) => {
        setReferenceImages((prev) => [...prev, ...files])
    }, [])

    const { getRootProps: coverRoot, getInputProps: coverInput } = useDropzone({
        onDrop: onDropCover,
        multiple: false,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
        },
    })
    const { getRootProps: assetsRoot, getInputProps: assetsInput } = useDropzone({
        onDrop: onDropAssets,
        multiple: true,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'video/mp4': ['.mp4'],
            'video/quicktime': ['.mov'],
            'video/webm': ['.webm'],
        },
    })
    const { getRootProps: referenceRoot, getInputProps: referenceInput } = useDropzone({
        onDrop: onDropReference,
        multiple: true,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
        },
    })

    // ─────────────────────────────────────────────
    // OBJECT URL MANAGEMENT
    // ─────────────────────────────────────────────
    useEffect(() => {
        const urls: Record<string, string> = {}
        brandAssets.forEach((f, i) => {
            urls[`brand-${i}-${f.name}`] = URL.createObjectURL(f)
        })
        referenceImages.forEach((f, i) => {
            urls[`reference-${i}-${f.name}`] = URL.createObjectURL(f)
        })
        if (brandCoverImage) {
            urls[`cover-${brandCoverImage.name}`] = URL.createObjectURL(brandCoverImage)
        }

        // Then in the useEffect, replace the revoke logic:
        Object.values(prevUrlsRef.current).forEach((u) => {
            try {
                URL.revokeObjectURL(u)
            } catch {
                /* ignore */
            }
        })
        prevUrlsRef.current = urls
        setAssetUrls(urls)
        return () => {
            Object.values(urls).forEach((u) => {
                try {
                    URL.revokeObjectURL(u)
                } catch {
                    /* ignore */
                }
            })
        }
    }, [brandAssets, referenceImages, brandCoverImage])

    // ─────────────────────────────────────────────
    // INPUT HANDLER
    // ─────────────────────────────────────────────
    const handleInput = (field: keyof ViewsCampaignFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        // Reset summary if budget or creators change
        if (['minCreators', 'totalBudget'].includes(field as string)) {
            setSummaryCalculated(false)
            setPaymentSummary(null)
        }
    }

    // ─────────────────────────────────────────────
    // CALCULATE
    // ─────────────────────────────────────────────
    const handleCalculate = () => {
        try {
            setProgressState('calculating')
            const { totalBudget, minCreators } = formData

            if (totalBudget <= 0) throw new Error('Please enter a valid budget pool.')
            if (minCreators <= 0) throw new Error('Minimum creators must be greater than 0.')

            // Fixed formula: requiredViews = budget ÷ 10
            const summary = derivePaymentSummary(totalBudget, minCreators)

            setPaymentSummary(summary)
            setFormData((prev) => ({ ...prev, requiredViews: summary.requiredViews }))
            setSummaryCalculated(true)

            toast.success('Budget Calculated', {
                description: `${summary.requiredViews.toLocaleString()} views needed to exhaust the pool.`,
            })
            setProgressState('idle')
        } catch (err: any) {
            toast.error('Calculation Failed', { description: err.message })
            setProgressState('error')
        }
    }

    // ─────────────────────────────────────────────
    // FILE REMOVAL
    // ─────────────────────────────────────────────
    const removeFile = (type: 'brandAssets' | 'referenceImages', index: number) => {
        if (type === 'brandAssets') {
            setBrandAssets((prev) => prev.filter((_, i) => i !== index))
        } else {
            setReferenceImages((prev) => prev.filter((_, i) => i !== index))
        }
    }

    // ─────────────────────────────────────────────
    // SUBMIT
    // ─────────────────────────────────────────────
    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!summaryCalculated || !paymentSummary) {
            toast.error('Calculate budget first')
            return
        }

        setLoading(true)
        setProgressState('uploading-assets')
        setError('')

        try {
            const {
                data: { user },
                error: userError,
            } = await supabaseClient.auth.getUser()
            if (userError || !user) throw new Error('Brand not authenticated')

            const filteredRequirements = (formData.requirementsText || []).filter((r) => r.trim() !== '')
            if (filteredRequirements.length === 0) throw new Error('At least one requirement is needed.')

            let brandAssetsData: any[] = []
            let referenceImagesData: any[] = []
            let coverImageUrl: string | null = null

            if (brandAssets.length > 0) {
                brandAssetsData = await uploadFilesToStorage(brandAssets, 'brand-assets')
            }
            if (referenceImages.length > 0) {
                referenceImagesData = await uploadFilesToStorage(referenceImages, 'reference-images')
            }
            if (brandCoverImage) {
                const fileName = `${Date.now()}_${brandCoverImage.name}`
                const filePath = `brand-covers/${fileName}`
                const { error: coverError } = await supabaseClient.storage
                    .from('campaign-assets')
                    .upload(filePath, brandCoverImage)
                if (coverError) throw coverError
                const {
                    data: { publicUrl },
                } = supabaseClient.storage.from('campaign-assets').getPublicUrl(filePath)
                coverImageUrl = publicUrl
            }

            const assets = [
                ...brandAssetsData.map((a) => ({ ...a, category: 'brand_asset' })),
                ...referenceImagesData.map((a) => ({ ...a, category: 'reference_image' })),
            ]

            setProgressState('inserting-data')

            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 7)

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
                        timeline: formData.timeline || null,
                        requirements: filteredRequirements,
                        objectives: ['views-based-payout'],
                        status: 'inreview',
                        created_by: user.id,
                        assets,
                        additional_information: formData.information || null,
                        dos: formData.dos || null,
                        donts: formData.donts || null,
                        target_countries: targetCountries,
                        cover_image_url: coverImageUrl,
                        expires_at: expiresAt.toISOString(),
                        // Views campaign fields — costPer1kViews always COST_PER_1K_VIEWS
                        campaign_type: 'views_based',
                        total_budget_pool: formData.totalBudget,
                        remaining_budget_pool: formData.totalBudget,
                        cost_per_1k_views: COST_PER_1K_VIEWS,
                        required_views: paymentSummary.requiredViews,
                        accumulated_views: 0,
                        min_creators: formData.minCreators,
                        max_submissions: formData.minCreators,
                        budget: formData.totalBudget.toLocaleString(),
                        payout_type: 'view_pool',
                        payout: 'UGX 10,000 per 1k views',
                        pool_status: 'healthy',
                    },
                ])
                .select()
                .single()

            if (campaignError) throw new Error(campaignError.message)

            setProgressState('notifying-admin')
            addNotificationToTheAdmin({
                id: user.id,
                message: `(NEW-VIEWS-CAMPAIGN) ${formData.title} from Brand`,
                source: 'brand',
            })

            toast.success('Campaign Created Successfully', {
                description: 'Your views-based campaign has been submitted for review.',
            })
            setProgressState('complete')

            if (campaignData?.id) {
                router.push('/app/accounts/brand/campaigns')
            }
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Failed to create campaign.')
            setProgressState('error')
        } finally {
            setLoading(false)
        }
    }

    const progressLabel: Record<ProgressState, string> = {
        idle: 'Submit Campaign',
        calculating: 'Calculating...',
        'uploading-assets': 'Uploading Assets...',
        'inserting-data': 'Saving Campaign...',
        'notifying-admin': 'Notifying Admin...',
        complete: 'Done! Redirecting...',
        error: 'Retry Submission',
    }

    const isSubmitDisabled = loading || (progressState !== 'idle' && progressState !== 'error') || !summaryCalculated

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white mt-2">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900">New Views Campaign Brief</h1>
                <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
                    Creators compete for views on a first-come-first-served basis. Budget reduces dynamically as
                    verified views accumulate.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-8">
                    {/* TITLE */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Title</label>
                        <input
                            type="text"
                            maxLength={60}
                            value={formData.title}
                            onChange={(e) => handleInput('title', e.target.value)}
                            placeholder="Enter campaign title"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
                            required
                        />
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Description</label>
                        <textarea
                            rows={5}
                            value={formData.description}
                            onChange={(e) => handleInput('description', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                            required
                        />
                    </div>

                    {/* TIMELINE + COUNTRIES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Clock3 className="w-4 h-4 text-[#e85c51]" />
                                Timeline
                            </label>
                            <select
                                value={formData.timeline}
                                onChange={(e) => handleInput('timeline', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-[#e85c51]" />
                                Target Countries
                            </label>
                            <input
                                type="text"
                                value={formData.countries}
                                onChange={(e) => handleInput('countries', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                        </div>
                    </div>

                    {/* REQUIREMENTS */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Content Requirements</label>
                        {(formData.requirementsText || ['']).map((req, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-3">
                                <input
                                    type="text"
                                    value={req}
                                    placeholder={`Requirement ${idx + 1}`}
                                    onChange={(e) => {
                                        const updated = [...(formData.requirementsText || [''])]
                                        updated[idx] = e.target.value
                                        handleInput('requirementsText', updated)
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
                                />
                                {(formData.requirementsText || []).length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleInput(
                                                'requirementsText',
                                                (formData.requirementsText || []).filter((_, i) => i !== idx)
                                            )
                                        }
                                        className="text-red-500 text-sm"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() =>
                                handleInput('requirementsText', [...(formData.requirementsText || ['']), ''])
                            }
                            className="text-sm text-red-600 hover:underline"
                        >
                            + Add Requirement
                        </button>
                    </div>

                    {/* MEDIA */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Uploads</h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                                <div
                                    {...coverRoot()}
                                    className="border-2 border-dashed border-red-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-red-50 transition-colors"
                                >
                                    <input {...coverInput()} />
                                    {brandCoverImage && assetUrls[`cover-${brandCoverImage.name}`] && (
                                        <img
                                            src={assetUrls[`cover-${brandCoverImage.name}`]}
                                            alt="Cover preview"
                                            className="mt-3 w-full h-40 object-cover rounded-xl border border-gray-200"
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Assets</label>
                                <div
                                    {...assetsRoot()}
                                    className="border-2 border-dashed border-red-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-red-50 transition-colors"
                                >
                                    <input {...assetsInput()} />
                                    <p className="text-gray-400 text-sm">Upload videos and images</p>
                                </div>
                                {brandAssets.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {brandAssets.map((file, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                                            >
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    {file.type.startsWith('video/') ? (
                                                        <Video className="w-4 h-4 text-blue-500" />
                                                    ) : assetUrls[`brand-${i}-${file.name}`] ? (
                                                        <img
                                                            src={assetUrls[`brand-${i}-${file.name}`]}
                                                            alt={file.name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="w-4 h-4 text-green-500" />
                                                    )}
                                                    {file.name}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile('brandAssets', i)}
                                                    className="text-red-500 text-xs"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Images</label>
                                <div
                                    {...referenceRoot()}
                                    className="border-2 border-dashed border-red-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-red-50 transition-colors"
                                >
                                    <input {...referenceInput()} />
                                    <p className="text-gray-400 text-sm">
                                        {referenceImages.length > 0
                                            ? `${referenceImages.length} image${
                                                  referenceImages.length > 1 ? 's' : ''
                                              } selected`
                                            : 'Upload references for creators'}
                                    </p>
                                </div>
                                {referenceImages.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {referenceImages.map((file, i) => {
                                            const key = `reference-${i}-${file.name}`
                                            const url = assetUrls[key]
                                            return (
                                                <div
                                                    key={i}
                                                    className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-50"
                                                >
                                                    {url && (
                                                        <img
                                                            src={url}
                                                            alt={file.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile('referenceImages', i)}
                                                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                    >
                                                        ×
                                                    </button>
                                                    <p className="absolute bottom-0 left-0 right-0 text-[10px] text-white bg-black/40 px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {file.name}
                                                    </p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DOS & DONTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DosDontsList
                            title="Content Dos (What to include)"
                            value={formData.dos || ''}
                            onChange={(e) => handleInput('dos', e)}
                            placeholder="1. Use our new logo in the corner.\n2.  clearly.\n3. Keep video under 60 seconds."
                        />
                        <DosDontsList
                            title="Content Don'ts (What to avoid)"
                            value={formData.donts || ''}
                            onChange={(e) => handleInput('donts', e)}
                            placeholder="1. Do not mention competitor brand X.\n2. Do not use background music with explicit lyrics.\n3. Do not show the product package."
                        />
                    </div>

                    {/* BUDGET ENGINE — now only 2 inputs */}
                    <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Views Budget Engine</h2>
                            <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
                                Creators are paid based on accumulated views. The budget pool reduces dynamically until
                                exhausted.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            {/* Input 1: Minimum Creators */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Creators</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.minCreators || ''}
                                    onChange={(e) => handleInput('minCreators', parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                                />
                            </div>

                            {/* Input 2: Total Budget */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Total Budget Pool (UGX)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.totalBudget || ''}
                                    onChange={(e) => handleInput('totalBudget', parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                                />
                            </div>
                        </div>

                        {/* Read-only rate info */}
                        <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-white border border-red-100 rounded-xl">
                            <DollarSign className="w-4 h-4 text-[#e85c51]" />
                            <p className="text-sm text-gray-500">
                                Platform rate:{' '}
                                <span className="font-semibold text-gray-800">
                                    UGX {fmt(COST_PER_1K_VIEWS)} per 1,000 views
                                </span>{' '}
                                — fixed
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleCalculate}
                            disabled={loading || progressState === 'calculating'}
                            className="w-full py-4 bg-[#e85c51] hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors"
                        >
                            Calculate Budget Mechanics
                        </button>

                        {paymentSummary && (
                            <BudgetMeterPreview
                                totalBudgetPool={paymentSummary.totalBudget}
                                requiredViews={paymentSummary.requiredViews}
                                minCreators={paymentSummary.minCreators}
                            />
                        )}
                    </div>

                    {/* PROGRESS */}
                    {progressState !== 'idle' && progressState !== 'calculating' && (
                        <div className="space-y-3">
                            {[
                                { label: 'Uploading Assets', step: 'uploading-assets' },
                                { label: 'Saving Campaign', step: 'inserting-data' },
                                { label: 'Notifying Admin', step: 'notifying-admin' },
                            ].map((item, idx) => {
                                const steps = ['uploading-assets', 'inserting-data', 'notifying-admin', 'complete']
                                const currentIdx = steps.indexOf(progressState)
                                const stepIdx = steps.indexOf(item.step)
                                const done = currentIdx > stepIdx
                                const active = currentIdx === stepIdx
                                return (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div
                                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                                done
                                                    ? 'bg-green-500 text-white'
                                                    : active
                                                    ? 'bg-[#e85c51] text-white animate-pulse'
                                                    : 'bg-gray-200 text-gray-400'
                                            }`}
                                        >
                                            {done ? '✓' : idx + 1}
                                        </div>
                                        <span
                                            className={`text-sm ${
                                                done
                                                    ? 'text-green-600 font-medium'
                                                    : active
                                                    ? 'text-red-600 font-medium'
                                                    : 'text-gray-400'
                                            }`}
                                        >
                                            {item.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* ERROR */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-700">Submission Error</p>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* SUBMIT */}
                    <div className="border-t border-gray-100 pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className="w-full py-4 bg-[#e85c51] hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl transition-colors"
                        >
                            {progressLabel[progressState]}
                        </button>
                        {!summaryCalculated && (
                            <p className="text-center text-xs text-gray-400 mt-3">
                                Calculate the budget engine before submitting.
                            </p>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}

export default ViewsBasedCampaignForm
