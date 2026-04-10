'use client'

import { useState } from 'react'

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        questionType: '',
        description: '',
    })
    const [status, setStatus] = useState('')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async () => {
        setStatus('Sending...')

        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    role: formData.questionType,
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
                setFormData({ name: '', email: '', phone: '', questionType: '', description: '' })
            } else {
                setStatus(`❌ Error: ${result.error}`)
            }
        } catch (error) {
            console.error(error)
            setStatus('❌ Failed to send. Please try again later.')
        }
    }

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-black mb-4">
                        Send us a <span className="text-[#e85c51]">message</span>
                    </h1>
                </div>

                <div className="space-y-8">
                    {/* Name + Email + Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['name', 'email', 'phone'].map((field) => (
                            <div key={field}>
                                <label className="block text-black text-sm font-medium mb-3 capitalize">{field}</label>
                                <input
                                    type={field === 'email' ? 'email' : 'text'}
                                    name={field}
                                    value={(formData as any)[field]}
                                    onChange={handleInputChange}
                                    placeholder={`Enter your ${field}`}
                                    className="w-full px-4 py-4 rounded-lg text-black border placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Question Type */}
                    <div>
                        <label className="block text-black text-sm font-medium mb-3">Question Type</label>
                        <input
                            type="text"
                            name="questionType"
                            value={formData.questionType}
                            onChange={handleInputChange}
                            placeholder="e.g. Technical Support, Billing, Bug Report"
                            className="w-full px-4 py-4 rounded-lg text-black border placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-black text-sm font-medium mb-3">Description</label>
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
                        {status && <p className="mt-4 text-sm text-black">{status}</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}
