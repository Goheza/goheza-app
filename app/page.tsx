'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Image from 'next/image'
import logo from '@/assets/GOHEZA-02.png'
import {
    ArrowRight,
    DollarSign,
    Lightbulb,
    Play,
    Users,
    TrendingUp,
    Shield,
    BarChart3,
    Handshake,
    Globe,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Lazy-load heavy components
const Accordion = dynamic(() => import('@/components/ui/accordion').then((mod) => mod.Accordion), { ssr: false })
const AccordionItem = dynamic(() => import('@/components/ui/accordion').then((mod) => mod.AccordionItem), {
    ssr: false,
})
const AccordionTrigger = dynamic(() => import('@/components/ui/accordion').then((mod) => mod.AccordionTrigger), {
    ssr: false,
})
const AccordionContent = dynamic(() => import('@/components/ui/accordion').then((mod) => mod.AccordionContent), {
    ssr: false,
})
const ContactForm = dynamic(() => import('@/components/components/landing/contact-suppor'), { ssr: false })
const BrandCreatorTabs = dynamic(() => import('@/components/components/landing/tabs'), { ssr: false })

export default function GohezaLanding() {
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const navigate = (link: string) => {
        setMobileMenuOpen(false)
        router.push(link)
    }

    const fadeUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    }

    const stagger = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
    }

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            {/* Hero Section */}
            <section className="py-16 sm:py-20 bg-gradient-to-br from-white to-neutral-50 relative overflow-hidden">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                    className="container mx-auto px-4 text-center"
                >
                    <motion.h1
                        variants={fadeUp}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8 leading-tight"
                    >
                        TURN YOUR NEXT CAMPAIGN INTO A <span className="text-[#e85c51]">SOCIAL MEDIA TAKE OVER</span>
                    </motion.h1>
                    <motion.p
                        variants={fadeUp}
                        className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto"
                    >
                        Goheza connects businesses to thousands of content creators who create hundreds of videos
                        promoting products and services on social media making it impossible for your brand to be
                        ignored online
                    </motion.p>
                    <motion.div
                        variants={fadeUp}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-16"
                    >
                        <Button
                            size="lg"
                            onClick={() => navigate('/main/auth/signup')}
                            className="font-semibold bg-[#e85c51] hover:bg-[#df4848] transition-all"
                        >
                            Launch a Campaign
                        </Button>
                        <Button
                            size="lg"
                            onClick={() => navigate('/main/auth/signup')}
                            className="flex text-[#e85c51] hover:bg-transparent items-center gap-2 bg-transparent transition-all"
                        >
                            Start Creating <ArrowRight className="w-4 h-4" />
                        </Button>
                    </motion.div>

                    {/* Stats */}
                    <BrandCreatorTabs />
                </motion.div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-12 sm:py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-10 sm:mb-16"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
                        <p className="text-sm sm:text-lg text-gray-600">
                            Simple, transparent, and performance-driven. Connect, create, and earn with Goheza.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
                    >
                        {[
                            {
                                icon: DollarSign,
                                title: 'Brands Launch Campaigns',
                                text: "Brands create campaign with clear briefs, goals, assets, dos/don'ts and budget.",
                                color: 'purple',
                            },
                            {
                                icon: Lightbulb,
                                title: 'Creators apply with content',
                                text: 'Creators apply for the campaign with content and captions.',
                                color: 'blue',
                            },
                            {
                                icon: Play,
                                title: 'Brand approved content',
                                text: 'Brand filters, selects, and approves content for campaigns.',
                                color: 'green',
                            },
                            {
                                icon: DollarSign,
                                title: 'Creators Earn Per 1k Views',
                                text: 'Content goes live and creators earn per 1000 views.',
                                color: 'yellow',
                            },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeUp}
                                className="text-center p-5 rounded-lg hover:shadow-lg transition-shadow bg-white"
                            >
                                <div
                                    className={`w-14 h-14 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto mb-3`}
                                >
                                    <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-600">{item.text}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Why Choose Goheza */}
            <section id="features" className="py-12 sm:py-20 bg-gray-50">
                <div className="container mx-auto px-4 text-center mb-10 sm:mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3"
                    >
                        Why Choose Goheza?
                    </motion.h2>
                    <p className="text-sm sm:text-lg text-gray-600">
                        Goheza has over 5000 creators and growing each day ready to deliver your brand story.
                    </p>
                </div>

                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4 container mx-auto"
                >
                    {[
                        {
                            icon: Users,
                            title: 'Diverse content production',
                            text: 'Thousands of creators delivering campaigns in dances, skits, explainers, reviews, and more.',
                            color: 'purple',
                        },
                        {
                            icon: TrendingUp,
                            title: 'Performance based pay',
                            text: 'Brands pay for content that performs per 1000 views.',
                            color: 'blue',
                        },
                        {
                            icon: Shield,
                            title: 'Real time analytics',
                            text: 'Track content performance in real-time.',
                            color: 'green',
                        },
                        {
                            icon: BarChart3,
                            title: 'CSR',
                            text: 'Contribute to youth empowerment and skill development.',
                            color: 'yellow',
                        },
                        {
                            icon: Handshake,
                            title: 'Direct Creator Partnerships',
                            text: 'Access thousands of creators directly.',
                            color: 'red',
                        },
                        {
                            icon: Globe,
                            title: 'Fast secure payments',
                            text: 'Reliable payments through trusted gateways.',
                            color: 'indigo',
                        },
                    ].map((item, idx) => (
                        <motion.div key={idx} variants={fadeUp}>
                            <div className={`p-6 bg-white rounded-lg hover:shadow-xl transition-all`}>
                                <div
                                    className={`w-12 h-12 bg-${item.color}-100 rounded-lg flex items-center justify-center mb-4`}
                                >
                                    <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                <p className="text-gray-600">{item.text}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Ready to get started */}
            <section className="py-12 sm:py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center space-y-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ready to get started?</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                onClick={() => navigate('/main/auth/signup')}
                                size="lg"
                                className="border bg-[#e85c51] hover:border-[#e85c51] hover:text-white font-semibold text-white transition-all"
                            >
                                For Brands
                            </Button>
                            <Button
                                onClick={() => navigate('/main/auth/signup')}
                                size="lg"
                                variant="outline"
                                className="text-[#e85c51] hover:bg-white font-semibold border-2 border-[#e85c51] bg-transparent transition-all"
                            >
                                For Creators
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}

            <section id="faq" className="py-12 sm:py-20">
                <div className="container mx-auto px-4">
                    {/* Section Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-sm sm:text-lg text-gray-600">
                            Get answers to common questions about the Goheza platform.
                        </p>
                    </div>

                    {/* Accordion */}
                    <div className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible className="font-bold text-xl">
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="font-bold">
                                    Do creators need to have followers to join?
                                </AccordionTrigger>
                                <AccordionContent className="font-medium">
                                    No! Goheza believes creativity matters more than follower count. Anyone can join our
                                    platform and start earning from their content, regardless of their current social
                                    media following.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2">
                                <AccordionTrigger className="font-bold">
                                    How are payments tracked and calculated?
                                </AccordionTrigger>
                                <AccordionContent className="font-medium">
                                    Payments are calculated based on verified views of your content. We use advanced
                                    tracking technology to ensure accurate view counts, and creators earn based on
                                    performance metrics.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3">
                                <AccordionTrigger className="font-bold">How are views verified?</AccordionTrigger>
                                <AccordionContent className="font-medium">
                                    Goheza uses real-time analytics and platform interrogation to verify genuine views
                                    from social platforms—filtering out bots and fake engagements.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-4">
                                <AccordionTrigger className="font-bold">When do creators get paid?</AccordionTrigger>
                                <AccordionContent className="font-medium">
                                    Creators are paid for every 1000 verified views their approved content receives.
                                    Payments are processed automatically based on the creator’s selected payment method
                                    and preferred payout schedule: daily, weekly, or monthly.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-5">
                                <AccordionTrigger className="font-bold">
                                    What types of content can creators submit?
                                </AccordionTrigger>
                                <AccordionContent className="font-medium">
                                    Creators can submit various types of video content that align with brand campaign
                                    requirements. Each campaign specifies the content format and style preferences.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-6">
                                <AccordionTrigger className="font-bold">
                                    How do brands ensure content quality?
                                </AccordionTrigger>
                                <AccordionContent className="font-medium">
                                    Brands have review and approval processes in place to ensure content meets their
                                    quality standards and campaign objectives before going live.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    {/* Contact Form */}
                    <div className="text-center mt-8 sm:mt-12" id="contactus">
                        <p className="text-gray-600 mb-4">Still have questions? We're here to help.</p>
                        <ContactForm />
                    </div>
                </div>
            </section>
        </div>
    )
}
