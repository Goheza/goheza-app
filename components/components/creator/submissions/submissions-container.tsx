/**
 * Submissions container
 * @returns
 */
import NoSubmissionsBanner from './no-submission-item'
import SubmissionItem, { ISubmissionItem } from './submission-item'

interface ISubmissionsContainer {
    submissions: ISubmissionItem[]
    areSubmissionAvailable: boolean
}

type CommonStatusType = 'inreview' | 'approved' | 'rejected'

const StatusBadge: React.FC<{ status: CommonStatusType }> = ({ status }) => {
    const getStatusStyles = (status: CommonStatusType) => {
        switch (status) {
            case 'inreview':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'approved':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusStyles(status)}`}>{status}</span>
    )
}

export default function SubmissionsContainer(props: ISubmissionsContainer) {
    return (
        <div className="mb-8">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Submissions</h2>
                <p className="text-gray-600"></p>
            </div>

            {!props.areSubmissionAvailable ? (
                <NoSubmissionsBanner />
            ) : (
                <div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Table Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="font-medium text-gray-700">Campaign Title</div>
                                <div className="font-medium text-gray-700">Status</div>
                                <div className="font-medium text-gray-700">Submission Date</div>
                                <div className="font-medium text-gray-700"></div>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {props.submissions.map((submission, id) => (
                                <div key={id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="grid grid-cols-4 gap-4 items-center">
                                        <div className="font-medium text-gray-900">{submission.campaignTitle}</div>
                                        <div>
                                            <StatusBadge status={submission.status} />
                                        </div>
                                        <div className="text-red-500 font-medium">{submission.submissionDate}</div>
                                        <div className="text-right">
                                            <button className="text-red-500 hover:text-red-700 font-medium transition-colors">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
