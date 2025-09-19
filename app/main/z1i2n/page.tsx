
/**
 * A Page Used for Loading A few things and get to the real deal
 * @returns 
 */

export default function ZLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-6">
            {/* Logo */}
            <div className="text-2xl font-bold text-neutral-900">Goheza</div>

            {/* Spinner */}
            <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
        </div>
    )
}
