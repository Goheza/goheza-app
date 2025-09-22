import Link from "next/link";

export interface ISubmissionItem  { 
    campaignTitle:string;
    status : "inreview" | "approved" | "rejected",
    submissionDate:string;
    submissionDetailsLink:string;
    id:string;

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