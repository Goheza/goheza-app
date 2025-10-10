import { DollarSign, Lightbulb, Play, Wallet } from 'lucide-react'

// Swapping DollarSignIcon for Wallet to avoid duplicate icon import and for better visual representation of 'earning'
// The original code imported 'DollarSign' and 'DollarSignIcon', but DollarSignIcon doesn't exist in lucide-react. Assuming Wallet is a better fit for the final step.

const steps = [
    {
        icon: DollarSign,
        title: "1. Brands Launch Campaigns",
        description: "Brands create a campaign with a clear brief, goals, assets, do's and don'ts, and a set budget.",
        iconBg: "bg-indigo-50 border-indigo-200",
        iconText: "text-indigo-600",
        lineColor: "border-indigo-300"
    },
    {
        icon: Lightbulb,
        title: "2. Creators Apply with Content",
        description: "Creators apply for the campaign by submitting their unique content and attached captions.",
        iconBg: "bg-sky-50 border-sky-200",
        iconText: "text-sky-600",
        lineColor: "border-sky-300"
    },
    {
        icon: Play,
        title: "3. Brand Approves Content Use",
        description: "The brand filters, selects, and approves the best content for use in their campaign.",
        iconBg: "bg-teal-50 border-teal-200",
        iconText: "text-teal-600",
        lineColor: "border-teal-300"
    },
    {
        icon: Wallet, // Changed from DollarSignIcon
        title: "4. Creators Earn Per 1K Views",
        description: "Approved content goes live on social platforms, and creators earn for every 1000 views it generates.",
        iconBg: "bg-amber-50 border-amber-200",
        iconText: "text-amber-600",
        lineColor: "border-amber-300"
    },
]

export default function HowItWorksFlow() {
    return (
        <section id="how-it-works" className="py-12 sm:py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        How <span className="text-[#e85c51]">Goheza</span> Works
                    </h2>
                    <p className="text-md sm:text-xl text-gray-600 max-w-2xl mx-auto">
                        Simple, transparent, and performance-driven. Connect, create, and earn.
                    </p>
                </div>

                <div className="relative">
                    {/* Horizontal lines for desktop flow visualization */}
                    <div className="hidden lg:flex absolute inset-x-0 top-1/2 h-0.5 transform -translate-y-1/2 justify-around px-16 xl:px-24">
                        {steps.slice(0, -1).map((step, index) => (
                            <div key={index} className="flex-1 relative">
                                <hr className={`absolute top-0 w-[90%] left-5 ${step.lineColor} border-dashed`} />
                            </div>
                        ))}
                    </div>

                    {/* Steps Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`
                                    relative p-6 rounded-xl border border-gray-200 bg-white shadow-lg
                                    hover:shadow-2xl transition-all duration-300
                                    ${index % 2 !== 0 ? 'md:mt-12 lg:mt-0' : ''} /* Staggered effect on MD screens */
                                `}
                            >
                                {/* Vertical line for mobile flow visualization */}
                                {index < steps.length - 1 && (
                                    <div className={`absolute top-[4.5rem] left-[2.4rem] w-px h-[calc(100%-6rem)] ${steps[index].lineColor} border-dashed md:hidden`}></div>
                                )}

                                {/* Icon and Number Container */}
                                <div className={`w-14 h-14 ${step.iconBg} ${step.iconText} border-2 ${step.iconBg.replace('-50', '-200')} rounded-full flex items-center justify-center mb-4 relative z-10`}>
                                    <step.icon className="w-7 h-7" />
                                </div>
                                
                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}