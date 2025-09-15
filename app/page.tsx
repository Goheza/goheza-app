"use client"

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
    Facebook,
    Youtube,
    Mail,
    ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function GohezaLanding() {

    const router = useRouter();


    const navigate = (link:string)=>{
        router.push(link)
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="">
                <div className="container mx-auto px-4 py-4 flex  items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <div className="text-2xl font-bold text-black">Goheza</div>
                    </div>
                    <nav className="hidden md:flex space-x-6 font-semibold ml-4">
                        <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900">
                            How It Works
                        </Link>
                        <Link href="#features" className="text-gray-600 hover:text-gray-900">
                            Features
                        </Link>
                        <Link href="#faq" className="text-gray-600 hover:text-gray-900">
                            FAQ
                        </Link>
                    </nav>
                    <div className="flex items-center space-x-4 font-semibold">
                        <Button variant="ghost" onClick={()=>{navigate("/main/auth/signin")}}>Log In</Button>
                        <Button className="bg-[#c23e3e]" onClick={()=>{navigate("/main/auth/signup")}}>Sign Up</Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-br bg-neutral-50">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Empower Creators. <span className="text-[#c23e3e] ">Elevate Brands.</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Goheza connects brands with everyday content creators for performance-based campaigns—no
                        followers required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Button size="lg" className="font-semibold bg-[#c23e3e] hover:bg-[#df4848]">
                            Launch a Campaign
                        </Button>
                        <Button
                            size="lg"
                            className="flex text-[#c23e3e] hover:bg-transparent items-center gap-2 bg-transparent"
                        >
                            Start Creating <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl text-lg mx-auto">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[#c23e3e]  mb-2">$0</div>
                            <div className="text-gray-600">Follower Minimum</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[#c23e3e]  mb-2">24h</div>
                            <div className="text-gray-600">Fast Payouts</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[#c23e3e]  mb-2">Real-time</div>
                            <div className="text-gray-600">View Tracking</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[#c23e3e]  mb-2">$1/1K</div>
                            <div className="text-gray-600">Views Payout</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <p className="text-xl text-gray-600">
                            Simple, transparent, and performance-driven. Connect, create, and earn with Goheza.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Brands Launch Campaigns</h3>
                            <p className="text-gray-600">
                                Brands create campaigns with clear goals, budgets, and target audiences.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lightbulb className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Creators Submit Video Ideas</h3>
                            <p className="text-gray-600">
                                Everyday creators pitch unique content ideas for the brand's campaign.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Play className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Content Goes Live</h3>
                            <p className="text-gray-600">
                                Approved videos are published and put into the view-buy engine.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8 text-yellow-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Creators Earn Per View</h3>
                            <p className="text-gray-600">
                                Automatic payouts based on verified views. Fast, reliable, and transparent.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Goheza */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Goheza?</h2>
                        <p className="text-xl text-gray-600">
                            Built for the modern creator economy, with transparency, fairness, and performance at its
                            core.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card>
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

                        <Card>
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

                        <Card>
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

                        <Card>
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

                        <Card>
                            <CardContent className="p-6">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                                    <Handshake className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Direct Brand Partnerships</h3>
                                <p className="text-gray-600">
                                    Connect directly with brands. No intermediaries, build lasting relationships.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
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
                    </div>
                </div>
            </section>

            {/* Ready to get started */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-normal text-black mb-8">Ready to get started?</h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" variant="secondary" className="bg-[#c23e3e] font-semibold text-white ">
                            For Brands
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-[#c23e3e]  hover:bg-white font-semibold border-2 border-[#c23e3e] bg-transparent"
                        >
                            For Creators
                        </Button>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                        <p className="text-xl text-gray-600">
                            Get answers to common questions about the Goheza platform.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Do creators need to have followers to join?</AccordionTrigger>
                                <AccordionContent>
                                    No! Goheza believes creativity matters more than follower count. Anyone can join our
                                    platform and start earning from their content, regardless of their current social
                                    media following.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2">
                                <AccordionTrigger>How are payments tracked and calculated?</AccordionTrigger>
                                <AccordionContent>
                                    Payments are calculated based on verified views of your content. We use advanced
                                    tracking technology to ensure accurate view counts, and creators earn based on
                                    performance metrics.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3">
                                <AccordionTrigger>Who owns the content after it's created?</AccordionTrigger>
                                <AccordionContent>
                                    Content ownership terms are clearly defined in each campaign agreement. The specific
                                    rights and usage terms are outlined before creators begin working on any campaign.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-4">
                                <AccordionTrigger>How quickly do creators get paid?</AccordionTrigger>
                                <AccordionContent>
                                    Creators receive fast payouts within 24 hours through various payment methods
                                    including Mobile Money, PayPal, and Bank Transfer.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-5">
                                <AccordionTrigger>What types of content can creators submit?</AccordionTrigger>
                                <AccordionContent>
                                    Creators can submit various types of video content that align with brand campaign
                                    requirements. Each campaign specifies the content format and style preferences.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-6">
                                <AccordionTrigger>How do brands ensure content quality?</AccordionTrigger>
                                <AccordionContent>
                                    Brands have review and approval processes in place to ensure content meets their
                                    quality standards and campaign objectives before going live.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-gray-600 mb-4">Still have questions? We're here to help.</p>
                        <Button className="bg-[#c23e3e] text-white">Contact Support</Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-2xl font-bold text-white mb-4">Goheza</div>
                            <p className="text-gray-400 mb-6">
                                Empowering creators and elevating brands through performance-based marketing. We make it
                                easy for anyone to earn from their creativity and passion.
                            </p>
                            <div className="flex space-x-4">
                                <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                                <Youtube className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                                <Mail className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Platform</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        For Brands
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        For Creators
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Pricing
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Contact</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>support@goheza.com</li>
                                <li>Kampala, Uganda</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Support</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Help Center
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Contact Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Terms of Service
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 Goheza. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
