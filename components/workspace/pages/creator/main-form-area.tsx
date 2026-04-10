import { useState } from 'react'
import { Eye, DollarSign, Users, TrendingUp } from 'lucide-react'

export default function AnalyticsDashboard() {
    const [activeFilter, setActiveFilter] = useState('Last 14 Days')

    const filters = ['Last 7 Days', 'Last 14 Days', 'Sep 1, 2025 - Sep 25, 2025', 'Custom Range']

    const dates = ['Sep 11', 'Sep 13', 'Sep 15', 'Sep 17', 'Sep 19', 'Sep 21', 'Sep 23']

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                activeFilter === filter
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Store Visits Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Eye className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-gray-600 text-sm font-medium">Store Visits</span>
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
                            <span className="text-gray-600 text-sm font-medium">Total Revenue</span>
                        </div>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-bold text-gray-900">0$ made</span>
                            <div className="flex items-center gap-1 text-green-500 text-sm font-medium mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>0%</span>
                            </div>
                        </div>
                    </div>

                    {/* Leads Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="text-gray-600 text-sm font-medium">Leads</span>
                        </div>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-bold text-gray-900">0</span>
                            <div className="flex items-center gap-1 text-green-500 text-sm font-medium mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>0%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="h-64 flex items-end justify-between px-4">
                        {dates.map((date, index) => (
                            <div key={date} className="flex flex-col items-center gap-2">
                                <div className="w-8 h-32 bg-gray-100 rounded-t-md"></div>
                                <span className="text-xs text-gray-500 font-medium">{date}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
