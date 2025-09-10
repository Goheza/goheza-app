import Link from 'next/link'

/**
 *
 * Header Part of the creator
 * @returns
 */

export default function HeaderCreator() {
    return (
        <div className='space-x-4'>
            <Link href="/creator/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900">
                Help
            </Link>
        </div>
    )
}
