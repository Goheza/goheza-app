import HelpTicket, { IHelpTicket } from '@/components/components/common/help-ticket-item'

const sampleData: IHelpTicket[] = [
    {
        redirectLink: 'https://bing.com',
        shortNote: 'Welcome to London',
    },
    {
        redirectLink: 'https://bing.com',
        shortNote: 'Welcome to London',
    },
    {
        redirectLink: 'https://bing.com',
        shortNote: 'Welcome to London',
    },
    {
        redirectLink: 'https://bing.com',
        shortNote: 'Welcome to London',
    },
    {
        redirectLink: 'https://bing.com',
        shortNote: 'Welcome to London',
    },
    {
        redirectLink: 'https://bing.com',
        shortNote: 'Welcome to London',
    },
    {
        redirectLink: 'https://bing.com',
        shortNote: 'Welcome to London',
    },
]

export default function HelpPage() {
    return (
        <div className="w-full p-5  flex items-center justify-center ">
            <div className='w-[80%]'>
                <h2 className="p-5 text-lg md:text-xl lg:text-2xl font-semibold">Goheza Guides  - <span className='bg-[#f7beba41] text-red-400'>Brand</span></h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {sampleData.map((item, i) => (
                        <HelpTicket redirectLink={item.redirectLink} key={`sup${i}`} shortNote={item.shortNote} />
                    ))}
                </div>
            </div>
        </div>
    )
}
