import GohezaLanding from "@/components/website/pages/mainlandingPage";
import { Metadata } from "next";

export const metadata:Metadata = {
    title: 'Goheza',
    description:
        'Connect with thousands of content creators who promote your business, online and only pay for content that performs. Get started now',
}
export default function Page() {
    return (
        <GohezaLanding/>
    )
}