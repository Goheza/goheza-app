import { Bell } from 'lucide-react'
import Link from 'next/link'

/**
 *
 * Header Part of the creator
 * @returns
 */

interface IHeaderBrandProps {
    onWillOpenFunc: () => void
}

export default function HeaderBrand(props: IHeaderBrandProps) {
    return (
        <div className=" flex items-center space-x-5 ">
            <div className="space-x-8">
                <Link href="/main/brand/dashboard" className="text-gray-600  hover:text-[#e85c51]">
                    Dashboard
                </Link>
                <Link href="/main/brand/campaigns" className="text-gray-600  hover:text-[#e85c51]">
                    Campaigns
                </Link>
                <Link href="/main/brand/help" className="text-gray-600  hover:text-[#e85c51]">
                    Help
                </Link>
                <Link href="/main/brand/campaigns" className="text-gray-600  hover:text-[#e85c51]">
                    Payments
                </Link>
                <Link href="/main/brand/profile" className="text-gray-600  hover:text-[#e85c51]">
                    Settings
                </Link>
            </div>
            <button onClick={props.onWillOpenFunc} className='bg-[#f7beba41] cursor-default hover:bg-[#f7beba9a] p-2 rounded-full'>
                <Bell  className='h-5 w-5'/>
            </button>
        </div>
    )
}
