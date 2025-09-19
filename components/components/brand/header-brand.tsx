import Link from 'next/link'

/**
 *
 * Header Part of the creator
 * @returns
 */

export default function HeaderBrand() {
    return (
        <div className="space-x-8 ]">
            <Link href="/main/brand/dashboard" className="text-gray-600  hover:text-[#e85c51]">
                Dashboard
            </Link>
            <Link href="/main/brand/campaigns" className="text-gray-600  hover:text-[#e85c51]">
                Campaigns
            </Link>
              <Link href="/main/brand/campaigns" className="text-gray-600  hover:text-[#e85c51]">
                How it Works
            </Link>
             <Link href="/main/brand/campaigns" className="text-gray-600  hover:text-[#e85c51]">
                Payments
            </Link>
            <Link href="/main/brand/profile" className="text-gray-600  hover:text-[#e85c51]">
                Settings
            </Link>
        </div>
    )
}
