'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
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

    const receivingDomain = process.env.NEXT_PUBLIC_RESIEVING_DOMAIN! as string

    const handleSubmit = async () => {
        setStatus('Sending...')

        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: receivingDomain,
                    subject: `New Contact Form: ${formData.questionType || 'Message'}`,
                    message: `
                        <p><strong>Name:</strong> ${formData.name}</p>
                        <p><strong>Email:</strong> ${formData.email}</p>
                        <p><strong>Phone:</strong> ${formData.phone}</p>
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
                    phone: '',
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
                    {/* Name + Email + Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-black text-sm font-medium mb-3">
                                Name 
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
                            <label className="block text-black text-sm font-medium mb-3">
                                Email 
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
                        <div>
                            <label className="block text-black text-sm font-medium mb-3">
                                Phone
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Enter your phone number"
                                className="w-full px-4 py-4 rounded-lg text-black border placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-black text-sm font-medium mb-3">
                        Description 
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
