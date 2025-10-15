// This is a basic example, style it to match your app!

import Image from "next/image";
import logo from '@/assets/GOHEZA-02.png'


export default function NotVerifiedPage() {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center flex-grow">

            <div className=" flex items-center justify-center">
                <Image src={logo.src} width={100} height={30} alt="Goheza Logo" className=" p-0 m-0 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-[#e85c51]  mb-4">Awaiting Verification</h1>
            <p className="text-lg text-gray-700 mb-6">Thank you for creating your brand profile!</p>
            <p className="text-md text-gray-500 max-w-lg">
                Your account is currently under review by our administration team. This process is necessary before you
                can access your dashboard and create campaigns. We will notify you via email as soon as your profile is
                **verified**.
            </p>
            <p className="mt-8 text-sm text-gray-400">If you believe this is an error, please contact support.</p>
        </div>
    )
}
