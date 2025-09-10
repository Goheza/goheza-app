import Link from "next/link";

export interface ISubmissionItem  { 
    campaignTitle:string;
    status : "inreview" | "approved" | "feedback needed",
    submissionDate:string;
    submissionDetailsLink:string;

}


export default function SubmissionItem(props:ISubmissionItem) {
    return (
        <div>
            <div>{props.campaignTitle}</div>
            <div>{props.status}</div>
            <div>{props.submissionDate}</div>
            <Link href={props.submissionDetailsLink}>view Details</Link>
        </div>
    )
}