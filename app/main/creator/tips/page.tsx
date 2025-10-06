import HelpTicket, { IHelpTicket } from '@/components/components/common/help-ticket-item'

const sampleData: IHelpTicket[] = [
    {
        redirectLink: 'https://youtu.be/t-Xf12o4jt4?si=c4B_RxLAWSpjHW_d',
        shortNote: 'Tip 1',
    },
    {
        redirectLink: 'https://youtu.be/u7Sb-GIdBqw?si=aLi2921b7d-gldy9',
        shortNote: 'Tip 2',
    },
    {
        redirectLink: 'https://youtu.be/L2W3JzHobjU?si=6aT-vIBJ7tK70UsP',
        shortNote: 'Tip 3',
    },
    {
        redirectLink: 'https://youtu.be/-jbjQW6XuDs?si=lbw1A4PMSKJKGkzs',
        shortNote: 'Tip 4',
    },
    {
        redirectLink: 'https://youtu.be/xnOe8aA9Pmw?si=14kveNtKRPboEGhw',
        shortNote: 'Tip 5',
    },
  
]

export default function HelpPage() {
    return (
        <div className="w-full p-5  flex items-center justify-center ">
            <div className="w-[80%]">
                <h2 className="p-5 text-lg md:text-xl lg:text-2xl font-semibold">Goheza Guides - <span className='bg-[#f7beba41] text-red-400'>Creator</span></h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {sampleData.map((item, i) => (
                        <HelpTicket redirectLink={item.redirectLink} key={`sup${i}`} shortNote={item.shortNote} />
                    ))}
                </div>
            </div>
        </div>
    )
}
