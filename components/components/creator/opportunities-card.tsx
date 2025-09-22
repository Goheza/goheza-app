

/**
 * This the campaign cards. will lead to campaign/[id]
 */

import Link from "next/link";

export interface ICampaignCard {
    campaignName:string;
    campaignTimeline:string;
    campaignPayoutRange:string;
    campaignImageSource:string;
    campaignSourceID:string;
}

export default function CampaignCard(props:ICampaignCard) {
    return (
        <Link href={`/main/creator/campaign/${props.campaignSourceID}`} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="h-32 bg-green-500 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                    <div className="text-xs font-medium">MINIMAL ECO FRIENDLY</div>
                    <div className="text-xs">SAFE SAFE WORK</div>
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{props.campaignName}</h3>
                <p className="text-sm text-gray-600 mb-2">Up to {props.campaignPayoutRange}</p>
                <p className="text-xs text-gray-500">Deadline: {props.campaignTimeline}</p>
            </div>
        </Link>
    )
}
