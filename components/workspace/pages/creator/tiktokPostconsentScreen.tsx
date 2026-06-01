'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    CheckCircle2,
    AlertCircle,
    Loader2,
    ExternalLink,
    User,
    Eye,
    MessageCircle,
    Scissors,
    GitFork,
    ShieldCheck,
    ChevronDown,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type PrivacyLevel = 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'

interface CreatorInfo {
    nickname: string
    avatar_url?: string
    privacy_level_options: PrivacyLevel[]
    comment_disabled: boolean
    duet_disabled: boolean
    stitch_disabled: boolean
    max_video_post_duration_sec: number
}

interface TikTokPostConsentScreenProps {
    submissionId: string
    campaignId: string
    videoUrl: string
    caption: string
    creatorUserId: string
    onSuccess: (publishId: string, tiktokPostUrl: string) => void
    onError?: (message: string) => void
}

// ─── Privacy label helpers ─────────────────────────────────────────────────

const PRIVACY_LABELS: Record<PrivacyLevel, string> = {
    PUBLIC_TO_EVERYONE: 'Everyone (Public)',
    MUTUAL_FOLLOW_FRIENDS: 'Friends',
    FOLLOWER_OF_CREATOR: 'Followers',
    SELF_ONLY: 'Only me (Private)',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TikTokPostConsentScreen({
    submissionId,
    campaignId,
    videoUrl,
    caption,
    creatorUserId,
    onSuccess,
    onError,
}: TikTokPostConsentScreenProps) {
    // Creator info state
    const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null)
    const [loadingCreatorInfo, setLoadingCreatorInfo] = useState(true)
    const [creatorInfoError, setCreatorInfoError] = useState<string | null>(null)

    // Form state — all intentionally blank / false (TikTok requirement: no defaults)
    const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel | ''>('')
    const [allowComment, setAllowComment] = useState(false)
    const [allowDuet, setAllowDuet] = useState(false)
    const [allowStitch, setAllowStitch] = useState(false)

    // Commercial disclosure
    const [commercialDisclosureOn, setCommercialDisclosureOn] = useState(false)
    const [yourBrand, setYourBrand] = useState(false)
    const [brandedContent, setBrandedContent] = useState(false)

    // Music & branded content consent
    const [musicConsent, setMusicConsent] = useState(false)

    // Posting state
    const [isPosting, setIsPosting] = useState(false)
    const [postSuccess, setPostSuccess] = useState(false)

    // ── Fetch creator info on mount ──────────────────────────────────────────
    useEffect(() => {
        const fetchCreatorInfo = async () => {
            setLoadingCreatorInfo(true)
            setCreatorInfoError(null)
            try {
                const { data: sessionData } = await supabaseClient.auth.getSession()
                if (!sessionData.session) throw new Error('Not authenticated')

                const res = await fetch('/api/tiktok/creator-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionData.session.access_token}`,
                    },
                    body: JSON.stringify({ creatorUserId }),
                })

                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || 'Failed to load your TikTok account info.')
                }

                const data: CreatorInfo = await res.json()
                setCreatorInfo(data)
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Could not load TikTok info.'
                setCreatorInfoError(msg)
                onError?.(msg)
            } finally {
                setLoadingCreatorInfo(false)
            }
        }

        fetchCreatorInfo()
    }, [creatorUserId, onError])

    // ── Derived state ────────────────────────────────────────────────────────

    // Branded content forces privacy to not be SELF_ONLY
    const brandedContentSelected = commercialDisclosureOn && brandedContent
    const privateIsDisabled = brandedContentSelected

    // If branded content is on and user had selected private, clear it
    useEffect(() => {
        if (privateIsDisabled && privacyLevel === 'SELF_ONLY') {
            setPrivacyLevel('')
        }
    }, [privateIsDisabled, privacyLevel])

    // Determine which consent text to show
    const getConsentText = () => {
        if (commercialDisclosureOn && brandedContent) {
            return (
                <>
                    By posting, you agree to TikTok&apos;s{' '}
                    <a
                        href="https://www.tiktok.com/legal/page/global/bc-policy/en"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-[#e85c51] hover:text-[#c94038]"
                    >
                        Branded Content Policy
                    </a>{' '}
                    and{' '}
                    <a
                        href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-[#e85c51] hover:text-[#c94038]"
                    >
                        Music Usage Confirmation
                    </a>
                    .
                </>
            )
        }
        return (
            <>
                By posting, you agree to TikTok&apos;s{' '}
                <a
                    href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#e85c51] hover:text-[#c94038]"
                >
                    Music Usage Confirmation
                </a>
                .
            </>
        )
    }

    // ── Validation ───────────────────────────────────────────────────────────

    const canPost =
        privacyLevel !== '' &&
        musicConsent &&
        (!commercialDisclosureOn || yourBrand || brandedContent) &&
        !isPosting &&
        !postSuccess &&
        creatorInfo !== null

    // ── Post handler ─────────────────────────────────────────────────────────

    const handlePost = async () => {
        if (!canPost || !creatorInfo) return

        // Check creator can still post
        if (creatorInfo.privacy_level_options.length === 0) {
            toast.error('Your TikTok account cannot post right now. Please try again later.')
            return
        }

        setIsPosting(true)

        try {
            const { data: sessionData } = await supabaseClient.auth.getSession()
            if (!sessionData.session) throw new Error('Not authenticated')

            const res = await fetch('/api/tiktok/post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionData.session.access_token}`,
                },
                body: JSON.stringify({
                    submissionId,
                    campaignId,
                    videoUrl,
                    caption,
                    creatorUserId,
                    // Creator's explicit choices
                    privacyLevel,
                    disableComment: !allowComment,
                    disableDuet: !allowDuet,
                    disableStitch: !allowStitch,
                    // Commercial disclosure
                    commercialDisclosure: commercialDisclosureOn
                        ? {
                              yourBrand,
                              brandedContent,
                          }
                        : null,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to post to TikTok.')
            }

            setPostSuccess(true)
            toast.success('Your video is being posted to TikTok!')
            onSuccess(data.publishId, data.tiktokPostUrl ?? '')
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Something went wrong.'
            toast.error(msg)
            onError?.(msg)
        } finally {
            setIsPosting(false)
        }
    }

    // ── Loading state ────────────────────────────────────────────────────────

    if (loadingCreatorInfo) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#e85c51]" />
                <p className="text-sm">Loading your TikTok account info…</p>
            </div>
        )
    }

    if (creatorInfoError) {
        return (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-red-700">Could not load TikTok info</p>
                    <p className="text-sm text-red-600 mt-1">{creatorInfoError}</p>
                </div>
            </div>
        )
    }

    if (postSuccess) {
        return (
            <div className="bg-green-50 rounded-2xl border border-green-300 p-6 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                    <p className="text-base font-bold text-green-800">Posted to TikTok!</p>
                    <p className="text-sm text-green-700 mt-1">
                        Your video is being processed. It may take a few minutes to appear on your profile.
                    </p>
                </div>
            </div>
        )
    }

    // ── Main render ──────────────────────────────────────────────────────────

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-black px-6 py-4 flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                </svg>
                <span className="text-white font-semibold text-sm">Post to TikTok</span>
            </div>

            <div className="p-6 space-y-6">
                {/* Creator identity */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    {creatorInfo?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={creatorInfo.avatar_url}
                            alt={creatorInfo.nickname}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                        </div>
                    )}
                    <div>
                        <p className="text-xs text-gray-500">Posting as</p>
                        <p className="text-sm font-semibold text-gray-900">@{creatorInfo?.nickname}</p>
                    </div>
                </div>

                {/* Video preview */}
                {videoUrl && (
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Content Preview
                        </p>
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black">
                            <video src={videoUrl} controls className="w-full h-full object-contain">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        {caption && (
                            <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">{caption}</p>
                        )}
                    </div>
                )}

                {/* Privacy level — NO default, creator must choose */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-gray-500" />
                        Who can view this post <span className="text-[#e85c51]">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={privacyLevel}
                            onChange={(e) => setPrivacyLevel(e.target.value as PrivacyLevel)}
                            className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e85c51] focus:border-transparent text-gray-800"
                        >
                            <option value="" disabled>
                                — Select visibility —
                            </option>
                            {creatorInfo?.privacy_level_options.map((lvl) => (
                                <option key={lvl} value={lvl} disabled={privateIsDisabled && lvl === 'SELF_ONLY'}>
                                    {PRIVACY_LABELS[lvl]}
                                    {privateIsDisabled && lvl === 'SELF_ONLY'
                                        ? ' (unavailable for branded content)'
                                        : ''}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Interaction settings — all OFF by default */}
                <div>
                    <p className="text-sm font-semibold text-gray-800 mb-3">Allow interactions</p>
                    <div className="space-y-2.5">
                        {/* Allow Comment */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div
                                onClick={() => !creatorInfo?.comment_disabled && setAllowComment((v) => !v)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                    ${
                                        creatorInfo?.comment_disabled
                                            ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                                            : allowComment
                                            ? 'border-[#e85c51] bg-[#e85c51] cursor-pointer'
                                            : 'border-gray-300 bg-white cursor-pointer group-hover:border-[#e85c51]'
                                    }`}
                            >
                                {allowComment && !creatorInfo?.comment_disabled && (
                                    <svg viewBox="0 0 12 10" className="w-3 h-3 fill-white">
                                        <path
                                            d="M1 5l3.5 3.5L11 1"
                                            stroke="white"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div
                                className={`flex items-center gap-2 ${
                                    creatorInfo?.comment_disabled ? 'opacity-40' : ''
                                }`}
                            >
                                <MessageCircle className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">Allow Comments</span>
                                {creatorInfo?.comment_disabled && (
                                    <span className="text-xs text-gray-400">(disabled in your TikTok settings)</span>
                                )}
                            </div>
                        </label>

                        {/* Allow Duet */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div
                                onClick={() => !creatorInfo?.duet_disabled && setAllowDuet((v) => !v)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                    ${
                                        creatorInfo?.duet_disabled
                                            ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                                            : allowDuet
                                            ? 'border-[#e85c51] bg-[#e85c51] cursor-pointer'
                                            : 'border-gray-300 bg-white cursor-pointer group-hover:border-[#e85c51]'
                                    }`}
                            >
                                {allowDuet && !creatorInfo?.duet_disabled && (
                                    <svg viewBox="0 0 12 10" className="w-3 h-3 fill-white">
                                        <path
                                            d="M1 5l3.5 3.5L11 1"
                                            stroke="white"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div
                                className={`flex items-center gap-2 ${creatorInfo?.duet_disabled ? 'opacity-40' : ''}`}
                            >
                                <GitFork className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">Allow Duet</span>
                                {creatorInfo?.duet_disabled && (
                                    <span className="text-xs text-gray-400">(disabled in your TikTok settings)</span>
                                )}
                            </div>
                        </label>

                        {/* Allow Stitch */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div
                                onClick={() => !creatorInfo?.stitch_disabled && setAllowStitch((v) => !v)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                    ${
                                        creatorInfo?.stitch_disabled
                                            ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                                            : allowStitch
                                            ? 'border-[#e85c51] bg-[#e85c51] cursor-pointer'
                                            : 'border-gray-300 bg-white cursor-pointer group-hover:border-[#e85c51]'
                                    }`}
                            >
                                {allowStitch && !creatorInfo?.stitch_disabled && (
                                    <svg viewBox="0 0 12 10" className="w-3 h-3 fill-white">
                                        <path
                                            d="M1 5l3.5 3.5L11 1"
                                            stroke="white"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div
                                className={`flex items-center gap-2 ${
                                    creatorInfo?.stitch_disabled ? 'opacity-40' : ''
                                }`}
                            >
                                <Scissors className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">Allow Stitch</span>
                                {creatorInfo?.stitch_disabled && (
                                    <span className="text-xs text-gray-400">(disabled in your TikTok settings)</span>
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                {/* Commercial content disclosure */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-800">Content Disclosure</span>
                        </div>
                        {/* Toggle */}
                        <button
                            type="button"
                            onClick={() => {
                                setCommercialDisclosureOn((v) => !v)
                                if (commercialDisclosureOn) {
                                    setYourBrand(false)
                                    setBrandedContent(false)
                                }
                            }}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                commercialDisclosureOn ? 'bg-[#e85c51]' : 'bg-gray-200'
                            }`}
                        >
                            <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${
                                    commercialDisclosureOn ? 'translate-x-4.5' : 'translate-x-0.5'
                                }`}
                            />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Turn on if this content promotes yourself, a brand, product, or service.
                    </p>

                    {commercialDisclosureOn && (
                        <div className="space-y-2.5 pt-1 border-t border-gray-100">
                            {/* Your Brand */}
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={yourBrand}
                                    onChange={(e) => setYourBrand(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#e85c51] focus:ring-[#e85c51] shrink-0"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Your Brand</p>
                                    <p className="text-xs text-gray-500">
                                        You are promoting yourself or your own business.
                                    </p>
                                    {yourBrand && (
                                        <p className="text-xs text-amber-600 mt-1 font-medium">
                                            Your video will be labeled as &quot;Promotional content&quot;
                                        </p>
                                    )}
                                </div>
                            </label>

                            {/* Branded Content */}
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={brandedContent}
                                    onChange={(e) => setBrandedContent(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#e85c51] focus:ring-[#e85c51] shrink-0"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Branded Content</p>
                                    <p className="text-xs text-gray-500">
                                        You are promoting another brand or a third party.
                                    </p>
                                    {brandedContent && (
                                        <p className="text-xs text-amber-600 mt-1 font-medium">
                                            Your video will be labeled as &quot;Paid partnership&quot;
                                        </p>
                                    )}
                                </div>
                            </label>

                            {/* Validation nudge */}
                            {commercialDisclosureOn && !yourBrand && !brandedContent && (
                                <p className="text-xs text-[#e85c51] font-medium">
                                    You need to indicate if your content promotes yourself, a third party, or both.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Music / policy consent */}
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={musicConsent}
                        onChange={(e) => setMusicConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#e85c51] focus:ring-[#e85c51] shrink-0"
                    />
                    <p className="text-xs text-gray-600 leading-relaxed">{getConsentText()}</p>
                </label>

                {/* Post button */}
                <button
                    type="button"
                    onClick={handlePost}
                    disabled={!canPost}
                    title={
                        commercialDisclosureOn && !yourBrand && !brandedContent
                            ? 'You need to indicate if your content promotes yourself, a third party, or both.'
                            : undefined
                    }
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200
                        ${
                            canPost
                                ? 'bg-black text-white hover:bg-gray-800 active:scale-[0.98]'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isPosting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Posting…
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                            </svg>
                            Post to TikTok
                        </>
                    )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                    After posting, it may take a few minutes for your video to appear on TikTok.
                </p>
            </div>
        </div>
    )
}
