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

export default function SubmissionsContainer(props: ISubmissionsContainer) {
    return (
        <div className="mb-8">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Submissions</h2>
                <p className="text-gray-600">Track your campaign submissions and their status</p>
            </div>

            {!props.areSubmissionAvailable ? (
                <NoSubmissionsBanner />
            ) : (
                <div className="space-y-4">
                    {props.submissions.map((val, id) => {
                        return (
                            <SubmissionItem
                                key={id}
                                campaignTitle={val.campaignTitle}
                                status={val.status}
                                submissionDate={val.submissionDate}
                                submissionDetailsLink={val.submissionDetailsLink}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}
