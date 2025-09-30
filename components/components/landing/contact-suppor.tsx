'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        questionType: '',
        description: '',
    })
    const [status, setStatus] = useState('')

    const questionTypes = [
        'What is your question about?',
        'General Inquiry',
        'Technical Support',
        'Business Partnership',
        'Feature Request',
        'Bug Report',
        'Billing Question',
    ]

    const handleInputChange = (e: any) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async () => {
        setStatus('Sending...')

        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'youremail@yourdomain.com', // <-- replace with your receiving email
                    subject: `New Contact Form: ${formData.questionType || 'Message'}`,
                    message: `
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Type:</strong> ${formData.questionType}</p>
            <p><strong>Message:</strong></p>
            <p>${formData.description}</p>
          `,
                }),
            })

            const result = await res.json()

            if (result.success) {
                setStatus('✅ Your message has been sent!')
                setFormData({
                    name: '',
                    email: '',
                    questionType: '',
                    description: '',
                })
            } else {
                setStatus(`❌ Error: ${result.error}`)
            }
        } catch (error: any) {
            setStatus('❌ Failed to send. Please try again later.')
            console.error(error)
        }
    }

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Form Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-black mb-4">
                        Send us a <span className="text-[#e85c51]">message</span>
                    </h1>
                </div>

                {/* Form */}
                <div className="space-y-8">
                    {/* Name + Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-white text-sm font-medium mb-3">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter your name"
                                className="w-full px-4 py-4 rounded-lg text-black border placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                            />
                        </div>
                        <div>
                            <label className="block text-white text-sm font-medium mb-3">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                                className="w-full px-4 py-4 rounded-lg text-black border placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                            />
                        </div>
                    </div>

                   

                    {/* Description */}
                    <div>
                        <label className="block text-white text-sm font-medium mb-3">
                            Project description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter your question"
                            rows={6}
                            className="w-full px-4 py-4 rounded-lg text-black border placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e85c51] resize-vertical"
                        />
                    </div>

                    {/* Submit */}
                    <div className="pt-4">
                        <button
                            onClick={handleSubmit}
                            className="bg-[#e85c51] hover:bg-[#e77e76] text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                        >
                            Submit →
                        </button>
                        {status && <p className="mt-4 text-sm text-white">{status}</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}
