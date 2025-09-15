import Link from 'next/link'

/**
 *
 * Header Part of the creator
 * @returns
 */

export default function HeaderCreator() {
    return (
        <div className='space-x-6'>
             <Link href="/main/creator/dashboard" className="text-gray-600  hover:text-[#E66262]">
                Dashboard
            </Link>
        </div>
    )
}
