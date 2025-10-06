import { supabaseClient } from "@/lib/supabase/client"

export const uploadFilesToStorage = async (files: File[], folder: string) => {
    const uploadPromises = files.map(async (file) => {
        const fileName = `${Date.now()}_${file.name}`
        const filePath = `${folder}/${fileName}`

        const { data, error } = await supabaseClient.storage.from('campaign-assets').upload(filePath, file)

        if (error) throw error

        const {
            data: { publicUrl },
        } = supabaseClient.storage.from('campaign-assets').getPublicUrl(filePath)

        // Check if file is video or image
        const isVideo = file.type.startsWith('video/')

        return {
            name: file.name,
            url: publicUrl,
            type: file.type,
            size: file.size,
            media_type: isVideo ? 'video' : 'image', // Explicitly track media type
        }
    })

    return Promise.all(uploadPromises)
}
