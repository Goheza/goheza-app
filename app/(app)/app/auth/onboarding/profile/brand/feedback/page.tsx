import { Button } from '@/components/ui/button'

// --- Theme ---
const theme = {
    accent: '#e85c51',
    secondary: 'rgb(79 70 229)',
    bg: 'rgb(249 250 251)',
    card: 'white',
    cardBorder: 'rgb(229 231 235)',
    text: 'rgb(17 24 39)',
    infoBg: 'rgb(243 244 246)',
    infoBorder: 'rgb(209 213 219)',
} as const

// --- Sub-components ---

function SuccessIcon() {
    return (
        <div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
                backgroundColor: theme.accent,
                boxShadow: `0 0 20px ${theme.accent}33`,
            }}
        >
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </div>
    )
}

function NextStepsCard() {
    return (
        <div
            className="mb-7 rounded-lg border p-5"
            style={{ backgroundColor: theme.infoBg, borderColor: theme.infoBorder }}
        >
            <h2 className="mb-2 text-xl font-semibold" style={{ color: theme.secondary }}>
                What Happens Next?
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">
                We are verifying your details to ensure the best collaboration experience. We will contact you directly
                via email or phone when your account has been reviewed and is ready for activation.
            </p>
            <p className="mt-2 text-sm font-bold" style={{ color: theme.accent }}>
                Someone from our team will be in contact with you shortly.
            </p>
        </div>
    )
}

function ActionButtons() {
    return (
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
                asChild
                className="w-full border-2 px-8 py-5 text-base font-semibold sm:w-auto"
                style={{
                    backgroundColor: theme.accent,
                    borderColor: theme.accent,
                    color: 'white',
                    transition: 'background-color 0.3s',
                }}
            >
                <a href="/">Go Back to Homepage</a>
            </Button>

            <Button
                asChild
                variant="outline"
                className="w-full border-2 px-8 py-5 text-base font-semibold sm:w-auto"
                style={{
                    borderColor: theme.secondary,
                    color: theme.secondary,
                    backgroundColor: 'transparent',
                    transition: 'border-color 0.3s, color 0.3s',
                }}
            >
                <a href="mailto:info@goheza.com">Contact Support</a>
            </Button>
        </div>
    )
}

// --- Page ---

export default function FeedbackForBrandingPage() {
    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center p-6"
            style={{ backgroundColor: theme.bg }}
        >
            <div
                className="w-full max-w-2xl rounded-xl border p-8 text-center shadow-2xl backdrop-blur-sm md:p-12"
                style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
            >
                <SuccessIcon />

                <h1 className="mb-3 text-3xl font-extrabold md:text-4xl" style={{ color: theme.text }}>
                    Application Received!
                </h1>

                <p className="mb-6 text-lg font-light text-gray-600">
                    Your brand's application is now under review by our team.
                </p>

                <NextStepsCard />
                <ActionButtons />

                <p className="mt-8 text-xs text-gray-500">Thank you for choosing Goheza.</p>
            </div>
        </div>
    )
}
