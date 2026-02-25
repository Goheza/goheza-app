'use client'

import React, { useEffect, useState } from 'react'
import { activateInstagramOAuth } from '@/lib/social-media/instagram/instagram-auth'
import { activateTiktokOAuth } from '@/lib/social-media/tiktok/tiktok-auth'
import { supabaseClient } from '@/lib/supabase/client'
import { Instagram, CheckCircle2, ArrowRight, AlertCircle, ShieldCheck, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import logo from '@/assets/GOHEZA-02.png'


// --- Custom TikTok Icon ---
const TikTokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.3 6.3 0 01-1.87-1.57v8.43c-.02 2.22-.56 4.54-2.19 6.09-1.63 1.54-4.01 2.06-6.14 1.74-2.14-.32-4.14-1.74-5.02-3.74-.88-2.01-.65-4.48.6-6.26 1.25-1.78 3.48-2.73 5.64-2.42v4.06c-1.12-.13-2.31.25-3.03 1.14-.72.89-.72 2.22-.11 3.19.61.96 1.79 1.48 2.89 1.25 1.1-.23 1.93-1.25 1.94-2.37V.02z" />
    </svg>
)

export default function SocialMediaAuth() {
    const [isInstagramConnected, setIsInstagramConnected] = useState(false)
    const [isTikTokConnected, setIsTikTokConnected] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const onDidFinish = () => {
        //when they finish we take them to the creator's page
        router.push('/main/creator/dashboard')
    }

    useEffect(() => {
        const checkConnections = async () => {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()
            if (!user) return

            const { data: accounts } = await supabaseClient
                .from('social_accounts')
                .select('platform')
                .eq('user_id', user.id)

            if (!accounts) return
            setIsInstagramConnected(accounts.some((a) => a.platform === 'instagram'))
            setIsTikTokConnected(accounts.some((a) => a.platform === 'tiktok'))
        }
        checkConnections()
    }, [])

    const canFinish = isInstagramConnected || isTikTokConnected

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Goheza Navbar */}
            <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <Image
                        src={logo.src}
                        width={100}
                        height={30}
                        alt="Goheza Logo"
                        className=" p-0 m-0 object-contain"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect Socials</p>
                    </div>
                    <div className="w-8 h-8 bg-slate-100 rounded-full border border-slate-200" />
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-16">
                {/* Page Heading */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-3xl text-red-500 mb-6">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Connect Socials</h1>
                    <p className="text-slate-500 max-w-md mx-auto font-medium">
                        Link your creator accounts to start receiving campaign invites and track your performance
                        automatically.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Instagram Card */}
                    <div
                        className={`group relative p-6 rounded-2xl border-2 transition-all ${
                            isInstagramConnected
                                ? 'border-green-500 bg-green-50/30'
                                : 'border-slate-100 bg-slate-50 hover:border-red-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`p-3 rounded-xl ${
                                        isInstagramConnected
                                            ? 'bg-green-500 text-white'
                                            : 'bg-white text-pink-600 shadow-sm'
                                    }`}
                                >
                                    <Instagram size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase text-sm tracking-tight">Instagram Business</h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Connect for Reels & Post analytics
                                    </p>
                                </div>
                            </div>

                            {isInstagramConnected ? (
                                <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase">
                                    <CheckCircle2 size={18} /> Connected
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={activateInstagramOAuth}
                                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-all flex items-center gap-2"
                                >
                                    Connect <ArrowRight size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* TikTok Card */}
                    <div
                        className={`group relative p-6 rounded-2xl border-2 transition-all ${
                            isTikTokConnected
                                ? 'border-green-500 bg-green-50/30'
                                : 'border-slate-100 bg-slate-50 hover:border-red-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`p-3 rounded-xl ${
                                        isTikTokConnected ? 'bg-green-500 text-white' : 'bg-white text-black shadow-sm'
                                    }`}
                                >
                                    <TikTokIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase text-sm tracking-tight">TikTok Creator</h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Link your TikTok for video metrics
                                    </p>
                                </div>
                            </div>

                            {isTikTokConnected ? (
                                <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase">
                                    <CheckCircle2 size={18} /> Connected
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={activateTiktokOAuth}
                                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-all flex items-center gap-2"
                                >
                                    Connect <ArrowRight size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Connection Notice */}
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <AlertCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            Goheza only requests read-only access to your performance data. We will never post on your
                            behalf or access your private messages.
                        </p>
                    </div>

                    {/* Submit Action */}
                    <div className="pt-8">
                        <button
                            onClick={onDidFinish}
                            disabled={!canFinish}
                            className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-lg ${
                                canFinish
                                    ? 'bg-red-500 hover:bg-slate-900 text-white shadow-red-200'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </div>
                            ) : (
                                'Finish Setup'
                            )}
                        </button>
                        {!canFinish && (
                            <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
                                Connect at least one platform to proceed
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
