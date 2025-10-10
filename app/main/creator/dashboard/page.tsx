'use client'

import { useState, useEffect } from 'react'
import { Eye, DollarSign, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { DateRangePicker } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { supabaseClient } from '@/lib/supabase/client'

export default function AnalyticsDashboard() {
    const router = useRouter()

    const [userNameI, setUserName] = useState<string>('Goheza')
    const [activeFilter, setActiveFilter] = useState('Last 7 Days')
    const [dates, setDates] = useState<string[]>([])
    const [showPicker, setShowPicker] = useState(false)

    const [customRange, setCustomRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection',
        },
    ])

    const filters = ['Last 7 Days', 'Last 14 Days', 'Sep 1, 2025 - Sep 25, 2025', 'Custom Range']

    // helper: generate dates based on filter
    const generateDates = (filter: string, customStart?: Date, customEnd?: Date) => {
        const today = new Date()

        if (filter === 'Last 7 Days') {
            return eachDayOfInterval({
                start: subDays(today, 6),
                end: today,
            }).map((d) => format(d, 'MMM d'))
        }

        if (filter === 'Last 14 Days') {
            return eachDayOfInterval({
                start: subDays(today, 13),
                end: today,
            }).map((d) => format(d, 'MMM d'))
        }

        if (filter === 'Sep 1, 2025 - Sep 25, 2025') {
            return eachDayOfInterval({
                start: new Date(2025, 8, 1), // 8 = September
                end: new Date(2025, 8, 25),
            }).map((d) => format(d, 'MMM d'))
        }

        if (filter === 'Custom Range' && customStart && customEnd) {
            return eachDayOfInterval({
                start: customStart,
                end: customEnd,
            }).map((d) => format(d, 'MMM d'))
        }

        return []
    }

    // update dates whenever filter changes
    useEffect(() => {
        const onLoad = async () => {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (user) {
                // Determine the full name using fallback logic
                const fullName =
                    user.identities![0]?.identity_data?.full_name ||
                    user.user_metadata?.full_name ||
                    user.user_metadata.fullName ||
                    'Goheza'

                // Extract only the first name
                const firstName = fullName.split(' ')[0]

                // Set 'Goheza' as a final fallback if all other names were empty strings
                const name = firstName || 'Goheza'

                const avatar = user.identities![0]?.identity_data?.avatar_url || user.user_metadata?.avatar_url || ''

                setUserName(name)
            }
        }

        onLoad()

        if (activeFilter !== 'Custom Range') {
            setDates(generateDates(activeFilter))
        } else {
            setDates(generateDates('Custom Range', customRange[0].startDate, customRange[0].endDate))
        }
    }, [activeFilter, customRange])

    const navigateToCampaigns = () => {
        router.push('/main/creator/campaign')
    }

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-3xl flex item-center justify-between font-semibold text-gray-900 mb-2">
                        <span> Earnings</span>
                        <span>Hello {userNameI}, </span>
                    </h1>
                    <p className="text-gray-600 mb-6">Performance metrics for your submissions and campaigns.</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 relative">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => {
                                setActiveFilter(filter)
                                if (filter === 'Custom Range') {
                                    setShowPicker(true)
                                } else {
                                    setShowPicker(false)
                                }
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                activeFilter === filter
                                    ? 'bg-[#e85c51] text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}

                    {/* Date Range Picker Popup */}
                    {showPicker && (
                        <div className="absolute top-14 left-0 z-50 bg-white shadow-lg rounded-lg border border-gray-200 p-2">
                            <DateRangePicker
                                ranges={customRange}
                                onChange={(item) => setCustomRange([item.selection])}
                                moveRangeOnFirstSelection={false}
                                rangeColors={['#e85c51']}
                                direction="horizontal"
                                months={2}
                                showDateDisplay={true}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => {
                                        setDates(
                                            generateDates(
                                                'Custom Range',
                                                customRange[0].startDate,
                                                customRange[0].endDate
                                            )
                                        )
                                        setShowPicker(false)
                                    }}
                                    className="px-4 py-2 bg-[#e85c51] text-white rounded-md"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={() => setShowPicker(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Total Payable Views */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Eye className="w-5 h-5 text-[#e85c51]" />
                            </div>
                            <span className="text-gray-600 text-sm font-medium">Total Payable Views</span>
                        </div>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-bold text-gray-900">0 views made</span>
                            <div className="flex items-center gap-1 text-green-500 text-sm font-medium mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>0%</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Revenue Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="text-gray-600 text-sm font-medium">Total Earnings</span>
                        </div>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-bold text-gray-900">$0 made</span>
                            <div className="flex items-center gap-1 text-green-500 text-sm font-medium mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>0%</span>
                            </div>
                        </div>
                    </div>

                    {/* Leads Card */}
                    <div
                        onClick={navigateToCampaigns}
                        className="bg-[#e85c51] hover:bg-white hover:text-[#e85c51] text-white text-xl space-x-4 cursor-pointer p-6 rounded-xl flex items-center justify-center shadow-sm border-2 border-[#e85c51] md:col-span-2 lg:col-span-1"
                    >
                        <DollarSign className="w-5 h-5" />
                        <span>Start Earning</span>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="h-64 flex items-end justify-between px-4 overflow-x-auto">
                        {dates.length > 0 ? (
                            dates.map((date) => (
                                <div key={date} className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-32 bg-gray-100 rounded-t-md"></div>
                                    <span className="text-xs text-gray-500 font-medium">{date}</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-gray-400 text-sm">Select a date range</span>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <div
                        onClick={navigateToCampaigns}
                        className="bg-[#e85c51] h-[60px] w-[200px] hover:bg-white hover:text-[#e85c51] text-white text-xl space-x-4 cursor-pointer p-2 rounded-xl flex items-center justify-center shadow-sm border-2 border-[#e85c51]"
                    >
                        <DollarSign className="w-5 h-5" />
                        <span>Start Earning</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
