'use client'

import Image from 'next/image'
import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

interface ICampaignAssets {
    name: string
    imageSource: string
}

export interface ICampaignDetails {
    id: string
    campaignName: string
    campaignRequirements: string[]
    campaignPayout: string
    campaignAssets: Array<ICampaignAssets>
}

export default function CampaignOverview() {
    const params = useParams()
    const campaignId = params.id as string

    const [campaignDetails, setCampaignDetails] = useState<ICampaignDetails | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const [caption, setCaption] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'failure'>('idle')
    const [uploadProgress, setUploadProgress] = useState<number>(0)

    // Fetch campaign details from Supabase
    useEffect(() => {
        const fetchCampaignDetails = async () => {
            if (!campaignId) {
                setError('Campaign ID not found')
                setLoading(false)
                return
            }

            try {
                const { data, error: fetchError } = await supabaseClient
                    .from('campaigns') // Adjust table name as needed
                    .select('*')
                    .eq('id', campaignId)
                    .single()

                if (fetchError) {
                    throw new Error(fetchError.message)
                }

                if (!data) {
                    throw new Error('Campaign not found')
                }

                // Map the database response to your interface
                setCampaignDetails({
                    id: data.id,
                    campaignName: data.name || data.campaign_name,
                    campaignRequirements: data.requirements || [],
                    campaignPayout: data.payout || data.campaign_payout,
                    campaignAssets: data.assets || data.campaign_assets || [],
                })
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch campaign details')
            } finally {
                setLoading(false)
            }
        }

        fetchCampaignDetails()
    }, [campaignId])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
            setUploadStatus('idle')
            setUploadProgress(0)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'video/mp4': ['.mp4'],
        },
    })

    const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCaption(e.target.value)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!file) {
            alert('Please upload a video file.')
            return
        }

        setUploadStatus('uploading')
        setUploadProgress(0)

        const uploadInterval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(uploadInterval)
                    setUploadStatus('success')
                    return 100
                }
                return prev + 10
            })
        }, 500)

        try {
            // Get the current authenticated user
            const {
                data: { user },
                error: userError,
            } = await supabaseClient.auth.getUser()

            if (userError || !user) {
                throw new Error('User not authenticated')
            }

            // First, upload the video file to Supabase Storage
            const fileName = `${Date.now()}_${file.name}`
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('campaign-videos') // Make sure this bucket exists in your Supabase storage
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`)
            }

            // Get the public URL of the uploaded video
            const {
                data: { publicUrl },
            } = supabaseClient.storage.from('campaign-videos').getPublicUrl(fileName)

            // Save the submission to your database
            const { data: submissionData, error: dbError } = await supabaseClient
                .from('campaign_submissions') // Adjust table name as needed
                .insert([
                    {
                        user_id: user.id,
                        campaign_id: campaignId,
                        campaign_name: campaignDetails?.campaignName,
                        video_url: publicUrl,
                        caption: caption,
                        file_name: file.name,
                        file_size: file.size,
                        submitted_at: new Date().toISOString(),
                    },
                ])
                .select()

            if (dbError) {
                throw new Error(`Database error: ${dbError.message}`)
            }

            console.log('Submission successful:', submissionData)
        } catch (error) {
            setUploadStatus('failure')
            console.error('Submission error:', error)
        }
    }

    const renderFileStatus = () => {
        switch (uploadStatus) {
            case 'uploading':
                return (
                    <>
                        <p className="mt-2 text-gray-500 italic">Uploading...</p>
                        <div className="w-full h-2 bg-gray-200 rounded-lg mt-2">
                            <div
                                className="h-full bg-green-500 rounded-lg transition-all duration-300 ease-in-out"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <span className="text-sm mt-1">{uploadProgress}%</span>
                    </>
                )
            case 'success':
                return <p className="mt-2 text-green-500 italic">File uploaded successfully.</p>
            case 'failure':
                return <p className="mt-2 text-red-500 italic">File upload failed. Please try again.</p>
            default:
                return null
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="font-sans p-5 max-w-4xl mx-auto">
                <div className="flex justify-center items-center h-64">
                    <p className="text-lg text-gray-600">Loading campaign details...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="font-sans p-5 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">Error: {error}</p>
                </div>
            </div>
        )
    }

    // No campaign found
    if (!campaignDetails) {
        return (
            <div className="font-sans p-5 max-w-4xl mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-600">Campaign not found</p>
                </div>
            </div>
        )
    }

    const router = useRouter()
     useEffect(() => {
            const init = async () => {
                const {
                    data: { user },
                } = await supabaseClient.auth.getUser()
    
                if (!user) {
                    router.replace('/auth/signin')
                    return
                }

            }
    
            init()
        },[router])

    return (
        <div className="font-sans p-5 max-w-4xl mx-auto">
            <div className="bg-gray-200 h-40 mb-5"></div>

            <div className="mb-5">
                <h2 className="text-2xl font-semibold mb-2">Campaign Requirements</h2>
                <ul className="list-disc list-inside space-y-1">
                    {campaignDetails.campaignRequirements.map((req, index) => (
                        <li key={index}>{req}</li>
                    ))}
                </ul>
            </div>

            <div className="mb-5">
                <h2 className="text-2xl font-semibold mb-2">Campaign Name</h2>
                <span className="text-lg">{campaignDetails.campaignName}</span>
            </div>

            <div className="mb-5">
                <h2 className="text-2xl font-semibold mb-2">Campaign Assets</h2>
                <div className="flex gap-5">
                    {campaignDetails.campaignAssets.map((v, index) => (
                        <div key={index} className="flex flex-col items-center text-center">
                            <Image src={v.imageSource} alt={v.name} width={100} height={100} />
                            <span className="mt-2 text-sm text-gray-700">{v.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-5">
                <h2 className="text-2xl font-semibold mb-2">Campaign Payout</h2>
                <span className="text-lg font-bold text-green-600">{campaignDetails.campaignPayout}</span>
            </div>

            <form className="mb-5" onSubmit={handleSubmit}>
                <h2 className="text-2xl font-semibold mb-4">Submission</h2>

                <div className="mb-4">
                    <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                        Caption
                    </label>
                    <textarea
                        id="caption"
                        value={caption}
                        onChange={handleCaptionChange}
                        placeholder="Write a caption for your video"
                        className="w-full h-28 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200 ease-in-out ${
                            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                        }`}
                    >
                        <input {...getInputProps()} />
                        {file ? (
                            <p className="text-gray-900">{file.name}</p>
                        ) : (
                            <p className="text-gray-500">Drag and drop your MP4 file here</p>
                        )}
                        {renderFileStatus()}
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-[#E66262] text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    disabled={uploadStatus === 'uploading'}
                >
                    {uploadStatus === 'uploading' ? 'Submitting...' : 'Submit'}
                </button>
            </form>
        </div>
    )
}
