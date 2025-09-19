// components/main/brandProfile.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function BrandProfile() {
    const [companyContact, setCompanyContact] = useState('')
    const [brandAssetsFile, setBrandAssetsFile] = useState<File | null>(null)
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)
    const [campaignMedia, setCampaignMedia] = useState<File[]>([])
    const router = useRouter()

    const handleBrandAssetsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setBrandAssetsFile(event.target.files[0])
        }
    }

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setCompanyLogoFile(event.target.files[0])
        }
    }

    const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setCampaignMedia(Array.from(event.target.files))
        }
    }

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault()
        event.preventDefault()

        try {
            // Upload company logo
            let logoUrl = null
            if (companyLogoFile) {
                const { data, error } = await supabaseClient.storage
                    .from('brand-assets')
                    .upload(`logos/${Date.now()}-${companyLogoFile.name}`, companyLogoFile)

                if (error) throw error
                logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/main/brand-assets/${data.path}`
            }

            // Upload brand assets file
            let assetUrl = null
            if (brandAssetsFile) {
                const { data, error } = await supabaseClient.storage
                    .from('brand-assets')
                    .upload(`docs/${Date.now()}-${brandAssetsFile.name}`, brandAssetsFile)

                if (error) throw error
                assetUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/main/brand-assets/${data.path}`
            }

            // Insert into brand_profiles table
            const { error: insertError } = await supabaseClient.from('brand_profiles').insert([
                {
                    contact: companyContact,
                    logo_url: logoUrl,
                    assets_url: assetUrl,
                },
            ])

            if (insertError) throw insertError

            toast.success('Profile Saved Successfully')
            router.push('/main/brand/dashboard')
        } catch (err: any) {
            console.error('Error saving profile:', err.message)
            toast.error('Failed to save profile.')
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Setup</h1>
            <form onSubmit={handleSave} className="space-y-12">
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Company Contact</h2>
                    <input
                        type="text"
                        value={companyContact}
                        onChange={(e) => setCompanyContact(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#e85c51]  focus:border-[#e85c51] "
                        placeholder="Enter company contact information..."
                    />
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Company Logo</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
                        <p className="text-sm text-gray-500 mb-2">
                            Drag and drop your company logo here, or browse to upload.
                        </p>
                        <p className="text-xs text-gray-400 mb-4">Accepted formats: PNG, JPG, SVG. Max size: 5MB.</p>
                        <label
                            htmlFor="logo-upload"
                            className="cursor-pointer border border-[#e85c51]  text-[#e85c51] font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                        >
                            Browse Logo
                        </label>
                        <input
                            id="logo-upload"
                            type="file"
                            onChange={handleLogoChange}
                            accept=".png,.jpg,.jpeg,.svg"
                            className="sr-only"
                        />
                        {companyLogoFile && (
                            <p className="mt-2 text-sm text-gray-600">Selected file: {companyLogoFile.name}</p>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Brand Assets</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
                        <p className="text-sm text-gray-500 mb-2">
                            Drag and drop your brand assets document here, or browse to upload.
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                            Accepted formats: PDF, DOCX, AI, PSD. Max size: 20MB.
                        </p>
                        <label
                            htmlFor="assets-upload"
                            className="cursor-pointer bg-transparent border border-[#e85c51]  text-[#e85c51] font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                        >
                            Browse Files
                        </label>
                        <input
                            id="assets-upload"
                            type="file"
                            onChange={handleBrandAssetsChange}
                            accept=".pdf,.docx,.ai,.psd"
                            className="sr-only"
                        />
                        {brandAssetsFile && (
                            <p className="mt-2 text-sm text-gray-600">Selected file: {brandAssetsFile.name}</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#e85c51] text-white font-bold py-3 px-6 rounded-md hover:bg-[#d46f6f]  transition duration-200"
                    >
                        Save Profile
                    </button>
                </div>
            </form>
        </div>
    )
}
