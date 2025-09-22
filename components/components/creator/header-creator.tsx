import Link from 'next/link'

/**
 *
 * Header Part of the creator
 * @returns
 */

export default function HeaderCreator() {
    return (
        <div className="space-x-6">
            <Link href="/main/creator/dashboard" className="text-gray-600  hover:text-[#e85c51]">
                Dashboard
            </Link>
            <Link href="/main/creator/submissions" className="text-gray-600  hover:text-[#e85c51]">
                Submissions
            </Link>
            <Link href="/main/creator/help" className="text-gray-600  hover:text-[#e85c51]">
                Help
            </Link>
            
        </div>
    )
}
