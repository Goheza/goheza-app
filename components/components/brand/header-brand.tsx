import Link from 'next/link'

/**
 *
 * Header Part of the creator
 * @returns
 */

export default function HeaderBrand() {
    return (
        <div className="space-x-8 ]">
            <Link href="/main/brand/dashboard" className="text-gray-600  hover:text-[#E66262]">
                Dashboard
            </Link>
            <Link href="/main/brand/campaigns" className="text-gray-600  hover:text-[#E66262]">
                Campaigns
            </Link>
            <Link href="/main/brand/profile" className="text-gray-600  hover:text-[#E66262]">
                Settings
            </Link>
        </div>
    )
}
