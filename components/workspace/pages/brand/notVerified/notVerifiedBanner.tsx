import Image from 'next/image'
import logo from '@/assets/GOHEZA-02.png'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { LogOutUser } from '@/lib/supabase/auth/authHelpers'
import { useRouter } from 'next/navigation'

/**
 * This is Page Is For Brands Not verified
 * @returns
 */

export default function NotVerifiedBanner() {
    const router = useRouter()

    const onWillSignOutUser = async () => {
        LogOutUser()
        router.push("/app/auth/signup")
    }

    return (
        <>
            <Button
                size="lg"
                onClick={onWillSignOutUser}
                className="absolute right-10 top-6 font-semibold bg-[#e85c51] hover:bg-[#df4848] transition-all hover:scale-105"
            >
                <ArrowLeft className="mr-2" />
                Sign out
            </Button>
            <div className="flex flex-col items-center justify-center p-8 text-center flex-grow">
                <div className=" flex items-center justify-center">
                    <Image
                        src={logo.src}
                        width={100}
                        height={30}
                        alt="Goheza Logo"
                        className=" p-0 m-0 object-contain"
                    />
                </div>
                <h1 className="text-3xl font-bold text-[#e85c51]  mb-4">Awaiting Verification</h1>
                <p className="text-lg text-gray-700 mb-6">Thank you for creating your brand profile!</p>
                <p className="text-md text-gray-500 max-w-lg">
                    Your account is currently under review by our administration team. This process is necessary before
                    you can access your dashboard and create campaigns. We will notify you via email as soon as your
                    profile is **verified**.
                </p>
                <p className="mt-8 text-sm text-gray-400">If you believe this is an error, please contact support.</p>
            </div>
        </>
    )
}
