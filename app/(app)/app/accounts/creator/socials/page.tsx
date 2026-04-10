'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { activateTiktokOAuth } from '@/lib/appServiceData/social-media/tiktok/tiktok-auth'
import { useRouter, useSearchParams } from 'next/navigation'

interface SocialAccount {
    id: string
    platform: string
    external_user_id: string
    extra_data: Record<string, string> | null
    connected_at: string
}

/**
 * Claude these are the expectedParams
 */
type returnParams = 'accepted' | 'error'

export default function ConnectedAccountsPage() {
    const [tiktokAccount, setTiktokAccount] = useState<SocialAccount | null>(null)
    const [loading, setLoading] = useState(true)
    const [removing, setRemoving] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const returnParams = useSearchParams()
    const [returnBanner, setReturnBanner] = useState<'accepted' | 'error' | null>(null)
    const router = useRouter() // add this import from 'next/navigation'

    useEffect(() => {
        const param = returnParams.get('return') as returnParams | null
        if (param === 'accepted' || param === 'error') {
            setReturnBanner(param)
            // Clean the URL param without a page reload
            const url = new URL(window.location.href)
            url.searchParams.delete('return')
            router.replace(url.pathname + url.search, { scroll: false })
        }
    }, [returnParams])

    useEffect(() => {
        fetchAccounts()
    }, [])

    async function fetchAccounts() {
        setLoading(true)
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()
        if (!user) return

        const { data } = await supabaseClient
            .from('social_accounts')
            .select('*')
            .eq('user_id', user.id)
            .eq('platform', 'tiktok')
            .maybeSingle()

        setTiktokAccount(data)
        setLoading(false)
    }

    async function handleRemove() {
        if (!tiktokAccount) return
        setRemoving(true)
        await supabaseClient.from('social_accounts').delete().eq('id', tiktokAccount.id)
        setTiktokAccount(null)
        setRemoving(false)
        setShowConfirm(false)
    }

    return (
        <div className=" p-6">
            <div className="mb-8">
                <h1 className="text-xl font-medium text-gray-900">Connected accounts</h1>
                <p className="text-sm text-gray-500 mt-1">Manage the social accounts linked to your creator profile.</p>
            </div>

            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Social platforms</p>

            {returnBanner === 'accepted' && (
                <div className="flex items-start gap-3 p-3.5 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm mb-5">
                    <span className="w-4 h-4 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        ✓
                    </span>
                    <div className="flex-1">
                        <p className="font-medium">TikTok connected successfully</p>
                        <p className="text-green-700 text-xs mt-0.5">
                            Your account is now linked and ready for campaigns.
                        </p>
                    </div>
                    <button
                        onClick={() => setReturnBanner(null)}
                        className="text-green-500 hover:text-green-700 text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            )}

            {returnBanner === 'error' && (
                <div className="flex items-start gap-3 p-3.5 rounded-lg border bg-red-50 border-red-200 text-red-800 text-sm mb-5">
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        ×
                    </span>
                    <div className="flex-1">
                        <p className="font-medium">Connection failed</p>
                        <p className="text-red-700 text-xs mt-0.5">
                            Something went wrong while linking your TikTok. Please try again.
                        </p>
                    </div>
                    <button
                        onClick={() => setReturnBanner(null)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-5">
                {/* Platform header */}
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                        <TikTokIcon />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">TikTok</p>
                        <p className="text-sm text-gray-500">
                            {tiktokAccount
                                ? 'Your TikTok account is linked and ready.'
                                : 'Connect your TikTok to submit content for campaigns.'}
                        </p>
                    </div>
                    {!tiktokAccount && !loading && (
                        <button
                            onClick={activateTiktokOAuth}
                            className="flex items-center gap-2 px-4 py-2 bg-[#E8553E] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <span>+</span> Connect account
                        </button>
                    )}
                </div>

                {/* Empty state */}
                {!loading && !tiktokAccount && (
                    <div className="mt-4 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-xl bg-gray-50 py-10 px-6 text-center">
                        <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center mb-4">
                            <TikTokIcon size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">No TikTok account added yet</p>
                        <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
                            Link your TikTok account to start submitting videos for campaigns and track your earnings.
                        </p>
                        <button
                            onClick={activateTiktokOAuth}
                            className="flex items-center gap-2 px-4 py-2 bg-[#E8553E] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <span>+</span> Connect TikTok
                        </button>
                    </div>
                )}

                {/* Connected state */}
                {!loading && tiktokAccount && (
                    <>
                        <hr className="my-4 border-gray-100" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-medium">
                                    {tiktokAccount.extra_data?.display_name?.slice(0, 2).toUpperCase() ?? 'TK'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        @{tiktokAccount.extra_data?.username ?? tiktokAccount.external_user_id}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Connected{' '}
                                        {new Date(tiktokAccount.connected_at).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                    Active
                                </span>
                            </div>
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-red-600 bg-red-50 border border-red-200 text-sm rounded-lg hover:opacity-80 transition-opacity"
                            >
                                Remove
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-3">
                            Removing your account will unlink it from all active campaigns.
                        </p>
                    </>
                )}

                {loading && <div className="mt-4 h-16 bg-gray-50 rounded-xl animate-pulse" />}
            </div>

            {/* Remove confirmation modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 border border-gray-200">
                        <h2 className="text-base font-medium text-gray-900 mb-2">Remove TikTok account?</h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-5">
                            Your account will be disconnected. You won&apos;t be able to submit content for campaigns
                            until you reconnect.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemove}
                                disabled={removing}
                                className="px-4 py-2 text-sm bg-[#E8553E] text-white rounded-lg hover:opacity-90 disabled:opacity-60"
                            >
                                {removing ? 'Removing…' : 'Yes, remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function TikTokIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path
                d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.02a8.16 8.16 0 004.77 1.52V7.1a4.85 4.85 0 01-1-.41z"
                fill="white"
            />
        </svg>
    )
}
