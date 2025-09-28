/**
 * CampaignCard component
 * Displays a campaign preview card linking to /main/creator/campaign/[id]
 */

import Image from 'next/image'
import Link from 'next/link'

export interface ICampaignCard {
  campaignName: string
  campaignTimeline: string
  campaignPayoutRange: string
  campaignImageSource?: string | null // allow undefined/null
  campaignSourceID: string
}

export default function CampaignCard({
  campaignName,
  campaignTimeline,
  campaignPayoutRange,
  campaignImageSource,
  campaignSourceID,
}: ICampaignCard) {
  // fallback for missing image
const fallbackImage = `https://placehold.co/400x225/e85c51/ffffff?text=${campaignName?.charAt(0) ?? 'C'}`


  return (
    <Link
      href={`/main/creator/campaign/${campaignSourceID}`}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="h-32 w-full relative">
        <Image
          src={campaignImageSource || fallbackImage}
          alt={campaignName}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{campaignName}</h3>
        <p className="text-sm text-gray-600 mb-2">Up to {campaignPayoutRange}</p>
        <p className="text-xs text-gray-500">Deadline: {campaignTimeline}</p>
      </div>
    </Link>
  )
}
