'use client'

import Link from 'next/link'
import { contactChannels, ContactChannel } from '@/lib/supportData'
import { FormEvent, useState } from 'react'

const useAuth = () => ({
    user: { email: 'user@example.com', role: 'creator', name: 'Jane Doe' },
    isLoading: false,
})

const SupportPage = () => {
    const { user, isLoading } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [status, setStatus] = useState('')

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setStatus('Sending...')

        const form = e.currentTarget
        const formData = {
            name: (form.querySelector('#name') as HTMLInputElement)?.value,
            email: (form.querySelector('#email') as HTMLInputElement)?.value,
            role: form.querySelector<HTMLInputElement>("input[name='userRole']")?.value,
            subject: (form.querySelector('#subject') as HTMLInputElement)?.value,
            message: (form.querySelector('#message') as HTMLTextAreaElement)?.value,
        }

        try {
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const result = await res.json()
            if (result.success) {
                setStatus('✅ Message sent successfully!')
                form.reset()
            } else {
                setStatus('❌ Failed to send message.')
            }
        } catch (error) {
            console.error(error)
            setStatus('❌ Server error. Try again later.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <div className="p-8 text-center">Loading user data...</div>

    return (
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900">Need Help? We've Got You Covered.</h1>
                <p className="mt-4 text-xl text-gray-500">
                    Select your preferred way to get in touch or send us a quick message below.
                </p>
            </div>

            {/* Contact Channels Grid */}
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
                {contactChannels.map((channel: ContactChannel) => (
                    <div
                        key={channel.id}
                        className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                    >
                        <h3 className="text-xl font-semibold text-gray-900">{channel.title}</h3>
                        <p className="mt-2 text-gray-500">{channel.description}</p>
                        <Link
                            href={channel.href}
                            target={channel.isExternal ? '_blank' : '_self'}
                            rel={channel.isExternal ? 'noopener noreferrer' : ''}
                            className="mt-4 inline-flex items-center text-sm font-medium text-[#e85c51] hover:text-blue-800"
                        >
                            {channel.ctaText}
                        </Link>
                    </div>
                ))}
            </div>

            {/* Direct Contact Form */}
            <div className="mt-16 bg-gray-50 p-8 rounded-lg shadow-inner">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Quick Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                defaultValue={user?.name || ''}
                                readOnly={!!user}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 ${
                                    user ? 'bg-gray-100' : 'focus:ring-[#e85c51] focus:border-[#e85c51]'
                                }`}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                defaultValue={user?.email || ''}
                                readOnly={!!user}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 ${
                                    user ? 'bg-gray-100' : 'focus:ring-[#e85c51] focus:border-[#e85c51]'
                                }`}
                                required
                            />
                        </div>
                    </div>

                    {/* Hidden Role */}
                    <input type="hidden" name="userRole" value={user?.role} />

                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                            Subject
                        </label>
                        <input
                            type="text"
                            id="subject"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-[#e85c51] focus:border-[#e85c51]"
                            placeholder="e.g., Error uploading video"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                            Message
                        </label>
                        <textarea
                            id="message"
                            rows={5}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-[#e85c51] focus:border-[#e85c51]"
                            placeholder="Describe your issue in detail."
                            required
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#e85c51] hover:bg-[#e85c51] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e85c51] disabled:opacity-50"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </form>
                {status && <p className="mt-4 text-sm">{status}</p>}
            </div>
        </div>
    )
}

export default SupportPage
