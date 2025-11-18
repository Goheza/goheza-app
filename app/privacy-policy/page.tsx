"use client"

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Shield, Lock, Eye, Users, FileText, Globe } from 'lucide-react'

const PrivacyPolicy: React.FC = () => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections)
        if (newExpanded.has(section)) {
            newExpanded.delete(section)
        } else {
            newExpanded.add(section)
        }
        setExpandedSections(newExpanded)
    }

    // Handlers to prevent copying and context menu
    const handleContextmenu = (e: React.MouseEvent) => {
        e.preventDefault() // Disables right-click context menu
    }

    const handleCopy = (e: React.ClipboardEvent) => {
        e.preventDefault() // Prevents the default copy action
        // Optional: Notify the user they cannot copy
        // alert('Copying content from this page is disabled.')
    }

    const sections = [
        {
            id: 'who-we-are',
            icon: Users,
            title: 'Who We Are',
            content:
                'Company: Goheza Technologies Company Limited\nAddress: Plot 19-21 Port Bell Road, Nakawa, Kampala\nEmail: info@goheza.com\nWebsite: goheza.com\n\nDepending on the context, we may act as a data controller or as a data processor on behalf of our business clients. When we act as a processor, the brand is considered the data controller, and our Data Processing Agreement applies.',
        },
        {
            id: 'scope',
            icon: Globe,
            title: 'Scope of This Policy',
            content:
                'This policy applies to:\n• Our public website (goheza.com)\n• The Goheza web application and APIs\n• Any integrations you connect to Goheza, including TikTok, Facebook and Instagram\n• Support, sales, and onboarding communications',
        },
        {
            id: 'data-collect',
            icon: FileText,
            title: 'Data We Collect',
            content:
                'Data You Provide to Us:\n• Account Data: Name, email address, password, company, role\n• Billing Data: Company name, VAT/CVR number, address, invoicing contacts, payment method\n• Communications: Support messages, emails, calls, feedback, surveys\n• Campaign Data: Creative briefs, product information, creator lists, pricing, deliverables\n• Contracts and Legal Agreements: Signatures, acceptance of terms, dates\n\nData Collected Automatically (Usage Data):\n• IP address, browser type and version, device identifiers, operating system\n• Referring URLs, pages visited, time and date of visit, clickstream data, error logs\n• Mobile device: device type, OS, unique device ID, mobile browser type, approximate location',
        },
        {
            id: 'cookies',
            icon: Eye,
            title: 'Cookies and Similar Technologies',
            content:
                'We use cookies, web beacons, pixels, and similar technologies to deliver, secure, analyze, and improve our Service.\n\nTypes of Cookies:\n• Session cookies: Deleted when the browser is closed\n• Persistent cookies: Stored until they expire or are deleted\n\nPurposes:\n• Necessary/Essential: Authentication, security, fraud prevention\n• Functionality: Remembering preferences, language, login status\n• Analytics/Product Improvement\n\nCookies can be managed via your browser settings. Disabling cookies may affect Service functionality.',
        },
        {
            id: 'social-data',
            icon: Users,
            title: 'TikTok, Facebook and Instagram Data',
            content:
                "When you connect your TikTok, Facebook or Instagram account to Goheza, we may access:\n\ninstagram_branded_content_ads_brand:\n• IDs of eligible creator posts, post metadata\n• Ability to authorize or stop branded content ads on your behalf\n• Purpose: To allow brands to boost creator posts directly from Goheza\n\nads_read:\n• Read-only ad account insights and metrics (spend, impressions, reach, clicks, CTR, CPC, CPM, video views)\n• Purpose: To enable performance reporting for Creator Ads\n• Usage: We only read reporting data; we do not modify ads or sell this data\n\nRevoking Access: You can remove Goheza's access anytime via Facebook Settings → Business Integrations or Instagram Settings → Security → Apps and Websites.",
        },
        {
            id: 'purposes',
            icon: FileText,
            title: 'Purposes and Legal Bases',
            content:
                'Contract Performance:\n• To create and manage accounts\n• To deliver platform functionality and reporting\n• To provide support and manage billing\n\nLegitimate Interests:\n• To secure and protect the Service\n• To improve and develop the Service\n• To enforce terms and defend legal claims\n\nConsent:\n• For marketing communications\n• When you connect external accounts\n\nLegal Obligations:\n• To comply with tax, accounting, and statutory requirements\n• To respond to lawful requests from authorities',
        },
        {
            id: 'sharing',
            icon: Users,
            title: 'Sharing of Personal Data',
            content:
                'We may share personal data with:\n• Service Providers/Sub-processors: Cloud hosting, analytics, email, payment processors (all bound by confidentiality agreements)\n• Business Partners: Brands, agencies, or creators collaborating on the platform (on your instruction)\n• Affiliates: Entities under common control with Goheza\n• Professional Advisors: Lawyers, auditors, insurers\n• Authorities: When required by law or to protect rights and safety\n• Business Transactions: Merger, acquisition, financing, or sale of assets\n\nWe do not sell personal data.',
        },
        {
            id: 'transfers',
            icon: Globe,
            title: 'International Data Transfers',
            content:
                "Your data may be processed outside Uganda. Where this occurs, we rely on lawful transfer mechanisms such as:\n• European Commission's Standard Contractual Clauses (SCCs)\n• Other appropriate safeguards\n\nYou may contact us for details on the safeguards in place.",
        },
        {
            id: 'retention',
            icon: FileText,
            title: 'Data Retention',
            content:
                'We retain personal data only as long as necessary. Typical retention periods:\n\n• Account and Profile Data: Lifetime of your account, plus up to 30 days after deletion\n• Meta-sourced Data: Until access is revoked, then deleted within 30 days\n• Billing and Transaction Records: Minimum 5 years (or as required by law)\n• Support Communications: Up to 3 years after resolution\n• Logs and Security Data: Typically 12 months\n• Aggregated/Anonymized Analytics: Indefinitely (cannot be linked to individuals)',
        },
        {
            id: 'rights',
            icon: Shield,
            title: 'Your Rights',
            content:
                'Subject to applicable law, you may have the following rights:\n• Access your personal data and receive a copy\n• Correct inaccurate or incomplete data\n• Delete your data (right to erasure)\n• Restrict processing\n• Object to processing based on legitimate interests or direct marketing\n• Data portability\n• Withdraw consent where processing is based on consent\n• Lodge a complaint with your local supervisory authority\n\nTo exercise these rights, email info@goheza.com. Identity verification may be required.',
        },
        {
            id: 'revoke',
            icon: Lock,
            title: 'Revoking Meta Access & Data Deletion',
            content:
                'You may revoke access anytime:\n• Facebook: Settings & Privacy → Settings → Business Integrations\n• Instagram: Settings → Security → Apps and Websites\n\nYou may also request data deletion via info@goheza.com. Meta-sourced personal data will be deleted within 30 days unless law requires longer retention.\n\nBrand account users should also contact their brand admin, who may control the data.',
        },
        {
            id: 'security',
            icon: Lock,
            title: 'Security',
            content:
                'We implement technical and organizational measures to protect personal data:\n• Encryption in transit and at rest\n• Access controls and least-privilege principles\n• Logging and monitoring\n• Regular backups\n• Vendor due diligence\n\nNo method of transmission or storage is 100% secure, and absolute security cannot be guaranteed.',
        },
        {
            id: 'children',
            icon: Shield,
            title: "Children's Privacy",
            content:
                'Our Service is not intended for children under 18, and we do not knowingly collect data from children under 18.\n\nParents or guardians who believe their child has provided personal data should contact us for deletion. If parental consent is required by law, we will obtain it.',
        },
        {
            id: 'automated',
            icon: Eye,
            title: 'Automated Decision-Making',
            content:
                'We do not use automated decision-making that produces legal or similarly significant effects. Changes to this practice will be reflected in this policy.',
        },
    ]

    return (
        // Add onCopy and onContextMenu to the main wrapper
        <div 
            className="min-h-screen bg-gray-50"
            onCopy={handleCopy}
            onContextMenu={handleContextmenu}
            // Tailwind CSS for user-select: none;
            style={{ userSelect: 'none' }}
        >
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center space-x-3 mb-3">
                        <Shield className="w-8 h-8 text-[#e85c51]" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Privacy Policy</h1>
                    </div>
                    <p className="text-gray-600">Goheza Technologies Company Limited</p>
                    <p className="text-sm text-gray-500 mt-1">Last updated: September 22, 2025</p>
                </div>
            </div>

            {/* Introduction */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <p className="text-gray-700 leading-relaxed">
                        This Privacy Policy explains how Goheza collects, uses, discloses, and safeguards personal
                        information when you access or use our website, platform, and related services, including when
                        you connect your TikTok, Facebook, or Instagram accounts to Goheza. It also outlines your rights
                        and how you can exercise them.
                    </p>
                    <p className="text-gray-700 leading-relaxed mt-4">
                        By using our Service, you consent to the collection and use of your information as described in
                        this Privacy Policy.
                    </p>
                </div>

                {/* Key Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <Shield className="w-6 h-6 text-[#e85c51] mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">Your Rights</h3>
                        <p className="text-sm text-gray-600">
                            Access, correct, delete, or restrict your personal data at any time
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <Lock className="w-6 h-6 text-[#e85c51] mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">Data Security</h3>
                        <p className="text-sm text-gray-600">
                            We use encryption and access controls to protect your information
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <Users className="w-6 h-6 text-[#e85c51] mb-2" />
                        <h3 className="font-semibold text-gray-900 mb-1">No Data Selling</h3>
                        <p className="text-sm text-gray-600">We never sell your personal data to third parties</p>
                    </div>
                </div>

                {/* Expandable Sections */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="divide-y divide-gray-200">
                        {sections.map((section) => {
                            const Icon = section.icon
                            return (
                                <div key={section.id} className="transition-colors hover:bg-gray-50">
                                    <button
                                        onClick={() => toggleSection(section.id)}
                                        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#e85c51]"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Icon className="w-5 h-5 text-[#e85c51] flex-shrink-0" />
                                            <span className="font-semibold text-gray-900">{section.title}</span>
                                        </div>
                                        {expandedSections.has(section.id) ? (
                                            <ChevronUp className="w-5 h-5 text-[#e85c51] flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        )}
                                    </button>
                                    {expandedSections.has(section.id) && (
                                        <div className="px-6 pb-4 pl-14">
                                            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                                {section.content}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Contact & Complaints */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Contact Us</h3>
                        <div className="text-sm text-gray-700 space-y-1">
                            <p>
                                <strong>Goheza Technologies Company Limited</strong>
                            </p>
                            <p>Plot 19-21 Port Bell Road, Nakawa</p>
                            <p>Kampala, Uganda</p>
                            <p className="pt-2">
                                <strong>Email:</strong>{' '}
                                <a href="mailto:info@goheza.com" className="text-[#e85c51] hover:underline">
                                    info@goheza.com
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Data Rights & Complaints</h3>
                        <div className="text-sm text-gray-700 space-y-2">
                            <p>
                                <strong>Data Deletion Requests:</strong>{' '}
                                <a href="mailto:info@goheza.com" className="text-[#e85c51] hover:underline">
                                    info@goheza.com
                                </a>
                            </p>
                            <p>
                                If you believe we have mishandled your personal data, you may lodge a complaint with
                                your local supervisory authority or contact us at{' '}
                                <a href="mailto:info@goheza.com" className="text-[#e85c51] hover:underline">
                                    info@goheza.com
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="mt-6 text-white bg-[#e85c51] bg-opacity-10 border border-[#e85c51] rounded-lg p-5">
                    <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-[#e85c51] flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-white">
                            <p className="font-semibold mb-1">Changes to This Privacy Policy</p>
                            <p>
                                We may update this Privacy Policy periodically. Changes will be posted on this page with
                                the updated "Last updated" date. Where appropriate, users will be notified by email or
                                via the Service. Review this policy regularly.
                            </p>
                        </div>
                    </div>
                </div>

              
            </div>
        </div>
    )
}

export default PrivacyPolicy