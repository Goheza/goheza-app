'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export interface IHelpTicket {
    shortNote: string
    redirectLink: string
}

export default function HelpTicket(props: IHelpTicket) {
    const [color, setColor] = useState<string>('')

    useEffect(() => {
        const getRandomGuideColor = () => {
            const guideColors = [
                // 🔴 Reds / Oranges
                '#e85c51',
                '#ff6d5f',
                '#f27867',
                '#ff914d',

                // 🟢 Greens
                '#34d399',
                '#10b981',
                '#16a34a',
                '#4ade80',

                // 🔵 Blues
                '#3b82f6',
                '#2563eb',
                '#38bdf8',
                '#0ea5e9',

                // 🟣 Purples / Pinks
                '#a855f7',
                '#8b5cf6',
                '#d946ef',
                '#ec4899',

                // 🟡 Yellows
                '#facc15',
                '#f59e0b',
                '#fde047',
            ]

            return guideColors[Math.floor(Math.random() * guideColors.length)]
        }

        setColor(getRandomGuideColor())
    }, [])

    return (
        <Link
            href={props.redirectLink}
            target="_blank"
            style={{ backgroundColor: color }}
            className="p-6 group rounded-xl  relative h-[356px] w-[254px] transition-transform duration-300 hover:scale-105"
        >
            <div>
                <div className="mb-2 text-neutral-100 font-bold">Goheza guides</div>
                <h1 className="font-bold text-xl text-white">{props.shortNote}</h1>
            </div>

            <div
                className="
          absolute bottom-5 flex items-center space-x-3 
          opacity-0 translate-y-3 transition-all duration-300 ease-in-out
          group-hover:opacity-100 group-hover:translate-y-0 text-white
        "
            >
                <span>Watch Now</span>
                <ChevronRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </Link>
    )
}
