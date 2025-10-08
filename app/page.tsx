'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
    Users,
    DollarSign,
    Lightbulb,
    Play,
    TrendingUp,
    Shield,
    BarChart3,
    Handshake,
    Globe,
    ArrowRight,
    Menu,
    X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import logo from '@/assets/GOHEZA-02.png'
import { BrandCreatorTabs } from '@/components/components/landing/tabs'
import ContactForm from '@/components/components/landing/contact-suppor' // fixed typo

export default function GohezaLanding() {
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const navigate = (link: string) => {
        setMobileMenuOpen(false)
        router.push(link)
    }

    // Reusable motion variants
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
                        Empower Creators. <span className="text-[#e85c51]">Elevate Brands.</span>
                    </motion.h1>
                    <motion.p
                        variants={fadeUp}
                        className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto"
                    >
                        Goheza connects brands with everyday content creators for performance-based campaigns—no
                        followers required.
                    </motion.p>
                    <motion.div
                        variants={fadeUp}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-16"
                    >
                        <Button
                            size="lg"
                            onClick={() => navigate('/main/auth/signup')}
                            className="font-semibold bg-[#e85c51] hover:bg-[#df4848] transform-gpu transition-all hover:scale-105"
                        >
                            Launch a Campaign
                        </Button>
                        <Button
                            size="lg"
                            onClick={() => navigate('/main/auth/signup')}
                            className="flex text-[#e85c51] hover:bg-transparent items-center gap-2 bg-transparent transform-gpu transition-all hover:scale-105"
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
                        <motion.div
                            variants={fadeUp}
                            className="text-center p-5 rounded-lg hover:shadow-lg transition-shadow transform-gpu hover:scale-105 bg-white"
                        >
                            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <DollarSign className="w-7 h-7 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Brands Launch Campaigns</h3>
                            <p className="text-sm text-gray-600">
                                Brands create campaigns with clear goals, budgets, and target audiences.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeUp}
                            className="text-center p-5 rounded-lg hover:shadow-lg transition-shadow transform-gpu hover:scale-105 bg-white"
                        >
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Lightbulb className="w-7 h-7 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Creators Submit Video Ideas</h3>
                            <p className="text-sm text-gray-600">
                                Everyday creators pitch unique content ideas for the brand's campaign.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeUp}
                            className="text-center p-5 rounded-lg hover:shadow-lg transition-shadow transform-gpu hover:scale-105 bg-white"
                        >
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Play className="w-7 h-7 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Content Goes Live</h3>
                            <p className="text-sm text-gray-600">
                                Approved videos are published and put into the view-buy engine.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeUp}
                            className="text-center p-5 rounded-lg hover:shadow-lg transition-shadow transform-gpu hover:scale-105 bg-white"
                        >
                            <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <DollarSign className="w-7 h-7 text-yellow-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Creators Earn Per View</h3>
                            <p className="text-sm text-gray-600">
                                Automatic payouts based on verified views. Fast, reliable, and transparent.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Why Choose Goheza */}
            <section id="features" className="py-12 sm:py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-10 sm:mb-16"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Why Choose Goheza?
                        </h2>
                        <p className="text-sm sm:text-lg text-gray-600">
                            Built for the modern creator economy, with transparency, fairness, and performance at its
                            core.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                    >
                        <motion.div variants={fadeUp}>
                            <Card className="hover:shadow-xl transform-gpu hover:scale-105 transition-all">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                        <Users className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No Follower Minimum</h3>
                                    <p className="text-gray-600">
                                        Creativity matters more than follower count. Anyone can join and start earning.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={fadeUp}>
                            <Card className="hover:shadow-xl transform-gpu hover:scale-105 transition-all">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                        <TrendingUp className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Performance-Based Payouts</h3>
                                    <p className="text-gray-600">
                                        Earn based on real verified views. Better performance means higher earnings.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={fadeUp}>
                            <Card className="hover:shadow-xl transform-gpu hover:scale-105 transition-all">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                        <Shield className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Fast, Secure Payments</h3>
                                    <p className="text-gray-600">
                                        Quick payouts via Mobile Money, PayPal, or Bank Transfer within 24 hours.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={fadeUp}>
                            <Card className="hover:shadow-xl transform-gpu hover:scale-105 transition-all">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                                        <BarChart3 className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
                                    <p className="text-gray-600">
                                        Track your campaign's progress and earnings in real-time with detailed insights.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={fadeUp}>
                            <Card className="hover:shadow-xl transform-gpu hover:scale-105 transition-all">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                                        <Handshake className="w-6 h-6 text-[#e85c51]" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Direct Brand Partnerships</h3>
                                    <p className="text-gray-600">
                                        Connect directly with brands. No intermediaries, build lasting relationships.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={fadeUp}>
                            <Card className="hover:shadow-xl transform-gpu hover:scale-105 transition-all">
                                <CardContent className="p-6">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                        <Globe className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Global Reach</h3>
                                    <p className="text-gray-600">
                                        Find campaigns and creators worldwide. Localized for African markets.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Ready to get started */}
            <section className="py-12 sm:py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center space-y-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ready to get started?</h2>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                onClick={() => {
                                    navigate('/main/auth/signup')
                                }}
                                size="lg"
                                className="border bg-[#e85c51] hover:border-[#e85c51] hover:text-white font-semibold text-white transform-gpu transition-all hover:scale-105"
                            >
                                For Brands
                            </Button>
                            <Button
                                onClick={() => {
                                    navigate('/main/auth/signup')
                                }}
                                size="lg"
                                variant="outline"
                                className="text-[#e85c51] hover:bg-white font-semibold border-2 border-[#e85c51] bg-transparent transform-gpu transition-all hover:scale-105"
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
                    <div className="text-center mb-6">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-sm sm:text-lg text-gray-600">
                            Get answers to common questions about the Goheza platform.
                        </p>
                    </div>

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
                                <AccordionTrigger className="font-bold">
                                    Who owns the content after it's created?
                                </AccordionTrigger>
                                <AccordionContent className="font-medium">
                                    Content ownership terms are clearly defined in each campaign agreement. The specific
                                    rights and usage terms are outlined before creators begin working on any campaign.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-4">
                                <AccordionTrigger className="font-bold">
                                    How quickly do creators get paid?
                                </AccordionTrigger>
                                <AccordionContent className="font-medium">
                                    Creators receive fast payouts within 24 hours through various payment methods
                                    including Mobile Money, PayPal, and Bank Transfer.
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

                    <div className="text-center mt-8 sm:mt-12">
                        <p className="text-gray-600 mb-4">Still have questions? We're here to help.</p>
                        <ContactForm />
                    </div>
                </div>
            </section>

         
        </div>
    )
}
