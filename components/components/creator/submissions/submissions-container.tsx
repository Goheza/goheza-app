'use client'

import { useState } from 'react'
import NoSubmissionsBanner from './no-submission-item'
import { ISubmissionItem } from './submission-item'

interface ISubmissionsContainer {
    submissions: ISubmissionItem[]
    areSubmissionAvailable: boolean
}

type CommonStatusType = 'inreview' | 'approved' | 'rejected'

const StatusBadge: React.FC<{ status: CommonStatusType }> = ({ status }) => {
    const styles = {
        inreview: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        approved: 'bg-green-100 text-green-800 border-green-200',
        rejected: 'bg-red-100 text-red-800 border-red-200',
    }

    return (
        <span
            className={`px-3 py-1 w-fit rounded-full text-xs sm:text-sm font-semibold border ${styles[status]}`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    )
}

export default function SubmissionsContainer({ submissions, areSubmissionAvailable }: ISubmissionsContainer) {
    const [filter, setFilter] = useState<'all' | CommonStatusType>('all')

    const filteredSubmissions =
        filter === 'all' ? submissions : submissions.filter((s) => s.status === filter)

    return (
        <div className="mb-8 px-2 sm:px-0">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Submissions</h2>
                    <p className="text-gray-600 text-sm">Manage your submission campaigns efficiently.</p>
                </div>

                {/* Filter */}
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'all' | CommonStatusType)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                >
                    <option value="all">All</option>
                    <option value="inreview">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {!areSubmissionAvailable ? (
                <NoSubmissionsBanner />
            ) : filteredSubmissions.length === 0 ? (
                <div className="text-gray-500 text-center py-8 rounded-lg border border-gray-200 bg-gray-50">
                    No submissions match this filter.
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSubmissions.map((submission) => (
                        <div
                            key={submission.id}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
                        >
                            {/* Desktop Grid */}
                            <div className="hidden sm:grid sm:grid-cols-4 gap-4 items-center">
                                <div className="font-medium text-gray-900">{submission.campaignTitle}</div>
                                <StatusBadge status={submission.status} />
                                <div className="text-gray-600 font-medium">{submission.submissionDate}</div>
                                <div className="text-right">
                                    <button
                                        onClick={() =>
                                            (window.location.href = `/main/creator/submissions/${submission.id}`)
                                        }
                                        className="text-[#e85c51] cursor-pointer bg-white border-2 border-[#e85c51] hover:bg-[#e85c51] hover:text-white p-2 rounded-2xl font-semibold transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Card */}
                            <div className="sm:hidden flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-700">Campaign:</span>
                                    <span className="text-gray-900">{submission.campaignTitle}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-700">Status:</span>
                                    <StatusBadge status={submission.status} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-700">Date:</span>
                                    <span className="text-gray-600">{submission.submissionDate}</span>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() =>
                                            (window.location.href = `/main/creator/submissions/${submission.id}`)
                                        }
                                        className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
