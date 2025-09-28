// components/main/brandProfile.tsx
'use client'

import { useState, useEffect } from 'react' // 👈 Import useEffect
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { FileText, Image as ImageIcon } from 'lucide-react' // 👈 Import icons for previews

// Define an interface for the brand profile structure from Supabase
interface IBrandProfile {
    contact: string
    logo_url: string | null
    assets_url: string | null
}

export default function BrandProfile() {
    // State for form inputs (new uploads)
    const [companyContact, setCompanyContact] = useState('')
    const [brandAssetsFile, setBrandAssetsFile] = useState<File | null>(null)
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)

    // State for existing data fetched from Supabase
    const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)
    const [existingAssetsUrl, setExistingAssetsUrl] = useState<string | null>(null)

    const [loading, setLoading] = useState(true)
    const router = useRouter()

    /**
     * Fetch existing brand profile data
     */
    const fetchBrandProfile = async (userId: string) => {
        try {
            const { data, error } = await supabaseClient
                .from('brand_profiles')
                .select('contact, logo_url, asset_url')
                .eq('user_id', userId) // Assuming brand_profiles is linked by a 'user_id' column
                .single()

            if (error && error.code !== 'PGRST116') {
                // PGRST116 is "No rows found"
                throw error
            }

            if (data) {
                setCompanyContact(data.contact || '')
                setExistingLogoUrl(data.logo_url)
                setExistingAssetsUrl(data.asset_url)
            }
        } catch (error: any) {
            console.error('Error fetching brand profile:', error.message)
            toast.error('Failed to load existing profile data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const init = async () => {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (!user) {
                router.replace('/main/auth/signin')
                return
            }

            fetchBrandProfile(user.id)
        }
        init()
    }, [])

    // --- Handlers for New File Inputs ---

    const handleBrandAssetsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setBrandAssetsFile(event.target.files[0])
            setExistingAssetsUrl(null) // Clear existing URL if user selects a new file
        }
    }

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setCompanyLogoFile(event.target.files[0])
            setExistingLogoUrl(null) // Clear existing URL if user selects a new file
        }
    }

    // NOTE: Removed handleMediaChange and campaignMedia state since they weren't fully integrated.
    // If you need them, you would add similar logic for existing URLs.

    /**
     * Handle Form Submission (Upload new files and save contact)
     */
    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault()

        try {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()
            if (!user) throw new Error('User not authenticated.')

            // --- 1. Upload Company Logo (if a NEW file is selected) ---
            let finalLogoUrl = existingLogoUrl // Start with existing URL
            if (companyLogoFile) {
                const { data, error } = await supabaseClient.storage
                    .from('brand-assets')
                    .upload(`logos/${user.id}/${Date.now()}-${companyLogoFile.name}`, companyLogoFile, {
                        upsert: true, // Overwrite if same file name/path
                    })

                if (error) throw error
                // Use the correct public URL construction
                finalLogoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${data.path}`
            }

            // --- 2. Upload Brand Assets File (if a NEW file is selected) ---
            let finalAssetUrl = existingAssetsUrl // Start with existing URL
            if (brandAssetsFile) {
                const { data, error } = await supabaseClient.storage
                    .from('brand-assets')
                    .upload(`docs/${user.id}/${Date.now()}-${brandAssetsFile.name}`, brandAssetsFile, {
                        upsert: true,
                    })

                if (error) throw error
                finalAssetUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${data.path}`
            }

            // --- 3. Update/Insert into brand_profiles table ---
            const { error: upsertError } = await supabaseClient.from('brand_profiles').upsert(
                {
                    user_id: user.id, // Primary key to update the right row
                    contact: companyContact,
                    logo_url: finalLogoUrl,
                    assets_url: finalAssetUrl,
                    // Add any other required columns here
                },
                { onConflict: 'user_id' } // Tell Supabase to update if user_id exists
            )

            if (upsertError) throw upsertError

            toast.success('Profile Saved Successfully')
            router.push('/main/brand/dashboard')
        } catch (err: any) {
            console.error('Error saving profile:', err.message)
            toast.error(`Failed to save profile: ${err.message}`)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#e85c51] focus:border-[#e85c51] "
                        placeholder="Enter company contact information..."
                    />
                </div>

                {/* --- COMPANY LOGO UPLOAD --- */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Company Logo</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
                        {/* 👈 Display Existing Logo or New Selection */}
                        {existingLogoUrl || companyLogoFile ? (
                            <div className="flex items-center justify-center space-x-4 mb-4">
                                <ImageIcon className="w-8 h-8 text-[#e85c51]" />
                                <p className="text-sm text-gray-700 font-medium">
                                    {companyLogoFile ? `New: ${companyLogoFile.name}` : 'Existing Logo is set'}
                                </p>
                                {existingLogoUrl && !companyLogoFile && (
                                    <img
                                        src={existingLogoUrl}
                                        alt="Current Logo"
                                        className="h-12 w-12 object-contain border rounded"
                                    />
                                )}
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500 mb-2">
                                    Drag and drop your company logo here, or browse to upload.
                                </p>
                                <p className="text-xs text-gray-400 mb-4">
                                    Accepted formats: PNG, JPG, SVG. Max size: 5MB.
                                </p>
                            </>
                        )}

                        <label
                            htmlFor="logo-upload"
                            className="cursor-pointer border border-[#e85c51] text-[#e85c51] font-medium py-2 px-4 rounded-md hover:bg-red-50 transition duration-200"
                        >
                            {existingLogoUrl || companyLogoFile ? 'Change Logo' : 'Browse Logo'}
                        </label>
                        <input
                            id="logo-upload"
                            type="file"
                            onChange={handleLogoChange}
                            accept=".png,.jpg,.jpeg,.svg"
                            className="sr-only"
                        />
                    </div>
                </div>

                {/* --- BRAND ASSETS UPLOAD --- */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Brand Assets</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
                        {/* 👈 Display Existing Asset or New Selection */}
                        {existingAssetsUrl || brandAssetsFile ? (
                            <div className="flex items-center justify-center space-x-4 mb-4">
                                <FileText className="w-8 h-8 text-[#e85c51]" />
                                <p className="text-sm text-gray-700 font-medium">
                                    {brandAssetsFile
                                        ? `New: ${brandAssetsFile.name}`
                                        : 'Existing Brand Assets file is set'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500 mb-2">
                                    Drag and drop your brand assets document here, or browse to upload.
                                </p>
                                <p className="text-xs text-gray-400 mb-4">
                                    Accepted formats: PDF, DOCX, AI, PSD. Max size: 20MB.
                                </p>
                            </>
                        )}

                        <label
                            htmlFor="assets-upload"
                            className="cursor-pointer bg-transparent border border-[#e85c51] text-[#e85c51] font-medium py-2 px-4 rounded-md hover:bg-red-50 transition duration-200"
                        >
                            {existingAssetsUrl || brandAssetsFile ? 'Change Files' : 'Browse Files'}
                        </label>
                        <input
                            id="assets-upload"
                            type="file"
                            onChange={handleBrandAssetsChange}
                            accept=".pdf,.docx,.ai,.psd"
                            className="sr-only"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-[#e85c51] text-white font-bold py-3 px-6 rounded-md hover:bg-[#d46f6f] transition duration-200"
                    >
                        Save Profile
                    </button>
                </div>
            </form>
        </div>
    )
}
