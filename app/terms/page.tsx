'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// WARNING: This component contains mechanisms to discourage copying.
// These methods are not foolproof and can be bypassed easily by a determined user.
const TermsAndConditions: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'brands' | 'creators'>('brands')
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
        e.preventDefault() // Prevents the default copy action (Ctrl+C/Cmd+C)
        // You could add an alert here if you want to notify the user.
        // alert('Copying content from this page is disabled.')
    }

    const brandSections = [
        {
            id: 'parties',
            title: '0. Parties',
            content:
                'Goheza Technologies Company Limited ("Goheza", "we", "us"), operating from Plot 19-21 Port Bell Road, Nakawa, Kampala, Uganda, provides a digital creator collaboration platform ("Platform" / "Website" "App"). These Terms govern every company, organization, or agency ("Brand", "you") that registers a Brand account on the Platform.',
        },
        {
            id: 'definitions',
            title: '1. Definitions',
            content:
                "Account: The Brand's dashboard within Goheza.\n\nAffiliate: Any entity that controls, is controlled by, or is under common control with a party.\n\nCampaign: A collaboration brief created by the Brand, specifying deliverables, CPM rate, maximum payout per video, creators needed, flat fees, timeline, and Budget.\n\nCPM: Cost per mille – payment rate per 1,000 organic views on approved Creator content.",
        },
        {
            id: 'eligibility',
            title: '2. Eligibility & Account Setup',
            content:
                'Legal Capacity: The individual accepting these Terms on behalf of the Brand warrants they are fully authorized to bind the Brand.\n\nMinimum Age: Goheza services are available only to users aged 18 years or older.\n\nAccurate Information: The Brand must provide complete, accurate, and up-to-date registration information.\n\nAccount Security: The Brand is responsible for all activity under its credentials.',
        },
        {
            id: 'license',
            title: '3. License & Acceptable Use',
            content:
                'Goheza grants the Brand a limited, non-exclusive, revocable, non-transferable licence to access and use the Platform solely for managing Campaigns.\n\nThe Brand must not:\n• Reverse-engineer, scrape, or copy Platform code\n• Upload malware or interfere with Platform operations\n• Use the Platform for unlawful, defamatory, discriminatory, or misleading content\n• Circumvent CPM tracking or verification',
        },
        {
            id: 'billing',
            title: '4. Billing & Irrevocability',
            content:
                'Irrevocability While Campaigns Are Live: Payments for Campaigns cannot be paused, canceled, or refunded while any Campaign is Live.\n\nPlatform Fees: Goheza charges a platform fee of 30% of the total billable amount for each Campaign.\n\nTaxes: All fees are exclusive of VAT or similar taxes, which the Brand is responsible for paying in addition.',
        },
        {
            id: 'wallet',
            title: '5. Brand Wallet – Funding & Lock-Up',
            content:
                'Top-Ups: Brands must pre-fund the Brand Wallet via accepted payment methods.\n\nNo Redemption/Withdrawal: Wallet funds are irrevocably locked and cannot be withdrawn or refunded.\n\nPermitted Uses: Funds may be used only for CPM payouts to creators, approved reimbursements, and Goheza platform fees.\n\nResidual Balance: Any unspent funds shall be distributed among creators who performed better than others.',
        },
        {
            id: 'campaigns',
            title: '6. Campaign Creation & Management',
            content:
                'Mandatory Fields: Each Campaign must include description, CPM rate, maximum payout per video, creators needed, flat fees, timelines, total Budget, and deliverables.\n\nApprovals: Brands select creators and approve content only through the Platform. Approvals are final.\n\nBudget Exhaustion: Payouts occur on a first-come-first-served basis.\n\nEdits & Cancellation: Brands may edit a Campaign only if no creator has applied.',
        },
        {
            id: 'content',
            title: '7. Content Usage, Ads & Expiry',
            content:
                "Ownership: Brands do not gain ownership of Creator content; IP rights remain with the Creator unless agreed in writing.\n\nOrganic Reposting: Full CPM payment grants a non-exclusive, non-transferable right to repost approved Creator content on the Brand's organic channels.\n\nPaid Advertising: Brands may use Creator content in paid ads at 10% of media spend.\n\nExpiry: Reposting and paid-use rights expire immediately if Campaign ends.",
        },
        {
            id: 'compliance',
            title: '8. Compliance & Indemnity',
            content:
                'Compliance: Brands ensure all Campaigns comply with applicable laws, including marketing and influencer disclosure rules.\n\nNo Infringement: Brands guarantee trademarks, product claims, and creative assets do not infringe third-party IP.\n\nIndemnity: Brands indemnify Goheza, its Affiliates, and Creators against claims or losses arising from breaches.',
        },
        {
            id: 'liability',
            title: '13. Limitation of Liability',
            content:
                "Goheza's total aggregate liability shall not exceed the lower of:\n• Total Fees paid by Brand in the twelve (12) months preceding the event; or\n• 20 million Uganda shillings.\n\nGoheza shall in no event be liable for indirect, incidental, consequential, special or punitive damages, or for loss of profits, revenue, goodwill, data or business interruption.",
        },
        {
            id: 'termination',
            title: '16. Termination',
            content:
                'By Brand: Written notice of zero (0) days; Wallet balances are forfeited.\n\nBy Goheza: Suspension or termination for material breach, fraud, non-payment, insolvency, sanctions, or repeated violations.\n\nEffect: All licences end; certain sections survive termination.',
        },
        {
            id: 'governing',
            title: '22. Governing Law & Venue',
            content:
                'These Terms are governed by Ugandan law. Parties submit to the exclusive jurisdiction of Ugandan courts.',
        },
    ]

    const creatorSections = [
        {
            id: 'acceptance',
            title: '1. Acceptance of Terms',
            content:
                'By accessing and using the Goheza website, you agree to be bound by these terms and conditions. These Terms constitute a legally binding agreement between you and Goheza.\n\nAge Confirmation: You must be at least 18 years old to use the service.\n\nAccount Information: You must provide truthful, accurate, current, and complete information during registration.\n\nAccount Security: You are responsible for maintaining the confidentiality of your account information.',
        },
        {
            id: 'eligibility',
            title: '2. Eligibility',
            content:
                'Minimum Age: You must be at least 18 years old to access and use the Goheza website.\n\nAge Verification: Goheza may require you to verify your age by submitting valid documentation.\n\nLegal Access: You represent that you have the legal right and capacity to enter into and comply with these Terms.\n\nProhibited Users: Individuals previously banned from Goheza are not eligible to create new accounts.',
        },
        {
            id: 'content',
            title: '3. User Content',
            content:
                'Creating Content: You may create and upload videos and other digital content directly to the Website, which will be redistributed to your connected Instagram and TikTok profiles.\n\nContent Quality Requirements: Content must be of high quality, truthful, not misleading, and must not infringe third-party rights.\n\nOwnership and Rights: You retain full ownership of your Content. However, rights may be transferred to the Brand as stated in campaign descriptions.\n\nCreator Approval: You must go through an approval process where the brand evaluates your content and profile.\n\nContent Approval: All campaign-related Content must be approved by the brand before publication.',
        },
        {
            id: 'deletion',
            title: '4. Deletion of Content',
            content:
                'Deletion from Social Media: If you delete Content from a brand collaboration from your TikTok profile or other connected social media profiles, your earnings from that collaboration will be cancelled.\n\nRight to Retain Earnings: To retain earnings, you must not delete related Content from your social media profiles.',
        },
        {
            id: 'license',
            title: '5. License to Goheza',
            content:
                'Grant of License: By uploading Content, you grant Goheza a non-exclusive, worldwide, royalty-free, transferable, fully sublicensable right and license to use, copy, modify, distribute, display, and perform your Content.\n\nSublicensing: Goheza may allow partners, affiliates, and third parties to use your Content.\n\nRoyalty-Free: Goheza is not required to compensate you for use of your Content under these Terms beyond campaign-specific agreements.\n\nDuration: The license is valid as long as your Content is available. If you delete Content, rights are transferred to Goheza.',
        },
        {
            id: 'disclaimer',
            title: '6. Disclaimer of Liability',
            content:
                'Condition of Website: The Website is provided "as is" and "as available" with no guarantees.\n\nNo Warranties: Goheza disclaims all warranties including merchantability, fitness for a particular purpose, title, and non-infringement.\n\nTechnological Risks: Goheza is not liable for security issues, viruses, malware, or technological errors.\n\nLimitation of Liability: Goheza is not liable for indirect, incidental, special, consequential, or punitive damages.',
        },
        {
            id: 'manipulation',
            title: '7. Prohibition on View Manipulation',
            content:
                'Influencers must not manipulate view counts through paid boosting services, buying fake views, or artificial inflation.\n\nSanctions: View manipulation may result in:\n• Immediate suspension or termination of your account\n• Forfeiture of all funds in your balance\n• Loss of all rights to previously uploaded Content\n• Legal action including police reports\n\nInvestigation: Goheza reserves the right to investigate any form of fraud or manipulation.',
        },
        {
            id: 'changes',
            title: '8. Changes to Terms',
            content:
                'Right to Modify: Goheza may change these Terms at any time at its sole discretion.\n\nNotice of Changes: Revised Terms will be published on the Website and become effective immediately.\n\nContinued Use: Your continued use after changes constitutes acceptance of revised Terms.\n\nMaterial Changes: Goheza will make reasonable efforts to notify you of material changes via email or other means.',
        },
        {
            id: 'termination',
            title: '9. Termination',
            content:
                'Right to Terminate: Goheza may suspend or terminate your access immediately for any reason, including violation of Terms.\n\nGrounds: Reasons include violation of Terms, illegal activities, misuse of services, or inappropriate conduct.\n\nConsequences: Upon termination, you lose access, all content may be deleted, and all licenses terminate.\n\nSurvival: Certain provisions including ownership, warranty disclaimers, indemnity, and liability limitations survive termination.',
        },
    ]

    const sections = activeTab === 'brands' ? brandSections : creatorSections

    return (
        // Add onCopy, onContextMenu, and user-select: none style to the main wrapper
        <div
            className="min-h-screen bg-gray-50"
            onCopy={handleCopy}
            onContextMenu={handleContextmenu}
            style={{ userSelect: 'none' }}
        >
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
                    <p className="text-gray-600">Goheza Technologies Company Limited</p>
                    <p className="text-sm text-gray-500 mt-1">Version 1.0 – September 2025</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('brands')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'brands'
                                    ? 'border-[#e85c51] text-[#e85c51]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            For Brands
                        </button>
                        <button
                            onClick={() => setActiveTab('creators')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'creators'
                                    ? 'border-[#e85c51] text-[#e85c51]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            For Creators/Influencers
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Introduction */}
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {activeTab === 'brands' ? (
                                <>
                                    These Terms govern every company, organization, or agency ("Brand", "you") that
                                    registers a Brand account on the Platform. By clicking "I accept" or otherwise using
                                    the Platform, the Brand agrees to be legally bound by these Terms.
                                </>
                            ) : (
                                <>
                                    These Terms and Conditions govern your use of the Goheza platform. By creating an
                                    account on the platform, you accept and agree to be legally bound by these Terms.
                                </>
                            )}
                        </p>
                    </div>

                    {/* Expandable Sections */}
                    <div className="divide-y divide-gray-200">
                        {sections.map((section) => (
                            <div key={section.id} className="transition-colors hover:bg-gray-50">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#e85c51]"
                                >
                                    <span className="font-semibold text-gray-900">{section.title}</span>
                                    {expandedSections.has(section.id) ? (
                                        <ChevronUp className="w-5 h-5 text-[#e85c51] flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    )}
                                </button>
                                {expandedSections.has(section.id) && (
                                    <div className="px-6 pb-4">
                                        <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                            {section.content}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
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
            </div>
        </div>
    )
}

export default TermsAndConditions
