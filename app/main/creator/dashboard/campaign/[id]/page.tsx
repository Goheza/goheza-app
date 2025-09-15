'use client'

import Image from 'next/image'
import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { baseLogger } from '@/lib/logger'
import { toast } from 'sonner'

interface ICampaignAssets {
    name: string
    url: string
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
    const router = useRouter()

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

                console.log(data.assets)
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

        baseLogger('CREATOR-OPERATIONS', 'WillMakeCampaignSubmission')

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
            baseLogger('CREATOR-OPERATIONS', 'WillGetAuthenticatedUser')

            const {
                data: { user },
                error: userError,
            } = await supabaseClient.auth.getUser()

            if (userError || !user) {
                throw new Error('User not authenticated')
            }

            baseLogger('CREATOR-OPERATIONS', 'DidGetAuthenticatedUser')

            baseLogger('CREATOR-OPERATIONS', 'WillUploadVideoIFAvailable')

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
            baseLogger('CREATOR-OPERATIONS', 'DidUploadVideoIFAvailable')
            baseLogger('CREATOR-OPERATIONS', 'WillGetVideoPublicURL')

            // Get the public URL of the uploaded video
            const {
                data: { publicUrl },
            } = supabaseClient.storage.from('campaign-videos').getPublicUrl(fileName)

            baseLogger('CREATOR-OPERATIONS', `DidGetVideoPublicURL:${publicUrl}`)

            baseLogger('CREATOR-OPERATIONS', 'WillSaveCampaignSubmission')

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
                baseLogger('CREATOR-OPERATIONS', 'DidFailToSaveCampaignSubmission')

                throw new Error(`Database error: ${dbError.message}`)
            }

            baseLogger('CREATOR-OPERATIONS', 'DidSuccefullySaveCampaignSubmission')
            router.push('/main/creator/dashboard')
            console.log('Submission successful:', submissionData)
            toast.success('Submission Successful')
        } catch (error) {
            setUploadStatus('failure')
            console.error('Submission error:', error)
            toast.error('Submission Successful')
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
                                className="h-full bg-[#E66262] rounded-lg transition-all duration-300 ease-in-out"
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
            <div className="font-sans p-5  mx-auto">
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

    return (
        <div className="font-sans p-5 space-y-12 max-w-4xl mx-auto mb-8">
            <div className="bg-gray-200 h-[200px] mb-12 rounded-2xl">
                <img src="/placeholder.png" className="w-full h-[200px] object-cover" />
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-5 text-[#e93838]">Campaign Requirements</h2>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-2 text-neutral-850">Campaign Name</h2>
                <span className="text-lg font-bold text-[#e93838]">{campaignDetails.campaignName}</span>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-7">Campaign Assets</h2>
                <div className="flex gap-2">
                    {campaignDetails.campaignAssets.map((v, index) => {
                        const imageSrc = '/placeholder.png' // ✅ fallback placeholder
                        return (
                            <div className='space-y-5'>
                                <div
                                    key={index}
                                    className="flex border rounded-2xl border-neutral-400 w-[300px] h-[300px] flex-col items-center text-center"
                                >
                                    <a
                                        href={v.url}
                                        download={v.name || `asset-${index}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group no-underline text-black"
                                    >
                                        <Image
                                        className='rounded-2xl'
                                            src={imageSrc}
                                            alt={v.name || 'Campaign Asset'}
                                            width={300}
                                            height={300}
                                        />
                                    </a>
                                </div>
                                <a
                                    href={v.url}
                                    download={v.name || `asset-${index}`}
                                    className=" text-sm mt-6 text-[#e93838]  hover:text-[#E66262]"
                                >
                                    {v.name}
                                </a>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-2">Payout</h2>
                <span className="text-lg font-bold text-[#e93838]">{campaignDetails.campaignPayout}</span>
            </div>

            <div>
                <div className="bg-white">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8">
                            <button
                                className={`py-3  border-red-500 text-red-600 px-1 border-b-2 font-bold text-sm transition-colors `}
                            >
                                Requirments
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="py-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Brief</h2>
                            <div className="space-y-3">
                                {campaignDetails.campaignRequirements.map((item, id) => (
                                    <div key={id} className="flex items-start">
                                        <span className="text-gray-600 mr-2">-</span>
                                        <p className="text-gray-700 leading-relaxed">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <form className="mb-5 space-y-7" onSubmit={handleSubmit}>
                <h2 className="text-2xl font-semibold mb-4">Submission</h2>

                <div>
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

                <div>
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
                            <p className="text-[#e93838]">Drag and drop your MP4 file here</p>
                        )}
                        {renderFileStatus()}
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-[150px] mb-5 float-right bg-[#e93838] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#f17474] transition-colors duration-200"
                    disabled={uploadStatus === 'uploading'}
                >
                    {uploadStatus === 'uploading' ? 'Submitting...' : 'Submit'}
                </button>
            </form>
        </div>
    )
}
