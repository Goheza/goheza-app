// components/main/brandProfile.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Image as ImageIcon } from 'lucide-react'

// --- Types/Interfaces ---
/**
 * REVISED: Removed 'asset_url'.
 */
interface IBrandProfile {
    contact: string
    logo_url: string | null
    // asset_url: string | null // Removed
}

// --- Helper Function for Upload Logic ---

/**
 * Handles logo upload to Supabase Storage and returns the public URL.
 * @param file The File object (logo) to upload.
 * @param userId The current user's ID to scope the file path.
 * @returns The full public URL of the uploaded file.
 */
const uploadLogoFileAndGetUrl = async (file: File, userId: string): Promise<string> => {
    const bucketName = 'brand-assets' 
    // Simplified path: {user_id}/logos/{timestamp}-{filename}
    const filePath = `${userId}/logos/${Date.now()}-${file.name}`

    const { data, error } = await supabaseClient.storage
        .from(bucketName)
        .upload(filePath, file, {
            upsert: true,
        })

    if (error) {
        console.error(`Supabase Storage Upload Error (Logo):`, error)
        throw new Error(`Failed to upload logo. RLS or network issue.`)
    }

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${data.path}`
}

// --- Main Component ---
export default function BrandProfile() {
    const [companyContact, setCompanyContact] = useState('')
    
    // State for the new logo file only
    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)
    
    // State for the existing logo URL only
    const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)

    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    /**
     * Fetch existing brand profile data
     */
    const fetchBrandProfile = async (userId: string) => {
        try {
            const { data, error } = await supabaseClient
                .from('brand_profiles')
                // Selecting only contact and logo_url
                .select('contact, logo_url') 
                .eq('user_id', userId)
                .returns<Omit<IBrandProfile, 'asset_url'>>() // Use a utility type for safety
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            if (data) {
                //@ts-ignore
                setCompanyContact(data.contact || '')
                //@ts-ignore

                setExistingLogoUrl(data.logo_url)
                // Existing Assets URL logic removed
            }
        } catch (error: any) {
            console.error('Error fetching brand profile:', error.message)
            toast.error('Failed to load existing profile data.')
        } finally {
            setLoading(false)
        }
    }
    
    // --- Initial Load Effect ---
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabaseClient.auth.getUser()

            if (!user) {
                router.replace('/main/auth/signin')
                return
            }

            fetchBrandProfile(user.id)
        }
        init()
    }, [router])

    // --- Handlers for File Inputs ---

    // Brand Assets handler removed

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setCompanyLogoFile(file)
            setExistingLogoUrl(null)
        }
    }

    /**
     * Handle Form Submission (Upload new files and save contact)
     */
    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault()
        setIsSaving(true)

        try {
            const { data: { user } } = await supabaseClient.auth.getUser()
            if (!user) throw new Error('User not authenticated.')

            // --- 1. Upload Company Logo ---
            let finalLogoUrl = existingLogoUrl
            if (companyLogoFile) {
                finalLogoUrl = await uploadLogoFileAndGetUrl(companyLogoFile, user.id)
            }

            // --- 2. Brand Assets Upload removed ---
            
            // --- 3. Update/Insert into brand_profiles table ---
            const { error: upsertError } = await supabaseClient.from('brand_profiles').upsert(
                {
                    user_id: user.id,
                    contact: companyContact,
                    logo_url: finalLogoUrl,
                    // asset_url removed from upsert
                },
                { onConflict: 'user_id' }
            )

            if (upsertError) throw upsertError

            toast.success('Profile Saved Successfully')
            router.push('/main/brand/dashboard')
        } catch (err: any) {
            console.error('Error saving profile:', err)
            const errorMessage = err.message.includes('row-level security') 
                ? 'Security Error: You do not have permission to upload files. Please ensure your RLS policies are correct.'
                : `Failed to save profile: ${err.message}`
            
            toast.error(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>
    }

    // --- Render Helper Component (Out of Main Function) ---

    // A helper to show the name of the file currently selected
    const getFileDisplay = (file: File | null, existingUrl: string | null) => {
        if (file) {
            return { name: `New: ${file.name}`, isExisting: false }
        }
        if (existingUrl) {
            return { name: `Existing Logo is set`, isExisting: true }
        }
        return null
    }

    const logoDisplay = getFileDisplay(companyLogoFile, existingLogoUrl)
    
    // --- JSX (HTML) ---
    return (
        <div className="p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Setup</h1>
            <form onSubmit={handleSave} className="space-y-12">
                
                {/* 1. COMPANY CONTACT INPUT */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Company Contact</h2>
                    <input
                        type="text"
                        value={companyContact}
                        onChange={(e) => setCompanyContact(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-[#e85c51] focus:border-[#e85c51] "
                        placeholder="Enter company contact information..."
                        required
                    />
                </div>

                {/* --- COMPANY LOGO UPLOAD --- */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Company Logo</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
                        {logoDisplay ? (
                            <div className="flex items-center justify-center space-x-4 mb-4">
                                <ImageIcon className="w-8 h-8 text-[#e85c51]" />
                                <p className="text-sm text-gray-700 font-medium">{logoDisplay.name}</p>
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
                            {logoDisplay ? 'Change Logo' : 'Browse Logo'}
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
                
                {/* --- BRAND ASSETS UPLOAD section completely removed --- */}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-[#e85c51] text-white font-bold py-3 px-6 rounded-md hover:bg-[#d46f6f] transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    )
}