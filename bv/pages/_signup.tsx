'use client'
/**
 * This is the signup page.
 */

import { GoogleSignupBtn } from '@/components/auth/googleSignup'
import { sendBrandEmailData } from '@/lib/brand/send-brand-data'
import { ALL_COUNTRIES } from '@/lib/countries'
import { baseURL } from '@/lib/env'
import logo from '@/assets/GOHEZA-02.png'
import { signInWithGoogle } from '@/lib/supabase/auth/signin'
import { ISignUpUser, signUpUserNormalAuth } from '@/lib/supabase/auth/signup'
import { supabaseClient } from '@/lib/supabase/client'
import { AuthError } from '@supabase/supabase-js'
import { Building2, Eye, EyeOff, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import ContentDivider from '@/components/auth/divider'
import MasterControlDialog from '@/lib/masterKey/masterDialog'
import MasterControlDetectorContainer from '@/lib/masterKey/masterDialog'

type UserRole = 'creator' | 'brand' | null

export default function SignUpPageForUser() {
    /**
     *
     * The current feasible details to be obtained
     */
    const [fullName, setFullName] = useState<string>('')
    const [confirmPassword, setConfirmPassword] = useState<string>('')
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [password, setPassword] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [selectedRole, setSelectedRole] = useState<UserRole>(null)

    /**
     * This is user to check the master Control Environemtn
     */
    const [isMasterControlEnv, setMasterControlEnv] = useState(false)
    /**
     * Other Unique Special Fields
     */
    const [phone, setPhone] = useState<string>('')
    const [country, setCountry] = useState<string>('')
    /**
     * The current router.
     */
    const router = useRouter()

    /**
     * Google Authentication For Creator(Since the creator is the only one )
     * who uses google auth
     */

    const creatorGoogleAuthentication = async () => {
        try {
            /**
             * The Only one using google authentication is the creator
             * so when used we take him to the onboarding page.
             */
            await signInWithGoogle({
                redirectURL: `${baseURL}/main/onboarding?io=creator`,
            })
        } catch (error) {
            if (error && error instanceof AuthError) {
                
            }
        }
    }

    /**
     * The current submit For to check for all valid Cases
     * @param e
     */
    const onWillSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        /**
         * Prevent the natural way of things;
         */
        e.preventDefault()

        /**
         * The current common checkers////
         */

        if (!selectedRole) {
            toast.info('Please select your role', { style: { fontSize: 14, padding: 10 } })
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords don't match", { style: { fontSize: 14, padding: 10 } })
            return
        }

        /**
         *ROLE_BASED_CHECKER
         * Role Checker based........:
         */

        if (selectedRole == 'creator') {
            /**
             * If the selected Role is a creator.....
             */

            if (!phone || !country) {
                
                

                toast.error('Please fill in all required fields for Creator.', {
                    style: { fontSize: 14, padding: 10 },
                })
                return
            }

            /**
             * ###########################################
             * THE CURRENT NORMAL(AUTHENTICATION PART FOR THE CREATOR) HERE:
             * ##########################################
             */

            const signinData: ISignUpUser = {
                email: email,
                country: country,
                fullName: fullName,
                password: password,
                phone: phone,
                role: 'creator',
            }

            try {
                toast.success('Creating Account...')
                /**
                 * Create the userAccount (Normal Authentication)
                 */
                await signUpUserNormalAuth(signinData)

                /**
                 * On Will Signup User
                 */
                toast.success('Welcome to Goheza!', {
                    style: { fontSize: 14, padding: 10 },
                    description: `Account created successfully as ${selectedRole}.`,
                })

                /**
                 * We take it to the mainPage (for profile creation)
                 */
                router.push('/main?so=creator')
            } catch (error) {
                toast.error('Sign Up Failed', {
                    style: { fontSize: 14, padding: 10 },
                    description: 'Account Already Present with another Email or Name',
                })
            }
        } else {
            /**
             * If the selected Role is a brand.....
             */
            /**
             *
             * We check if the masterControlEnvironment is active..
             */
            if (isMasterControlEnv) {
                /**
                 * MaterControlEnv Is Active at this point. we can create
                 * an account as a brand;
                 */
                //###############################################

                const signinData2: ISignUpUser = {
                    email: email,
                    country: country,
                    fullName: fullName,
                    password: password,
                    phone: phone,
                    role: 'brand',
                }

                try {
                    toast.success('Creating Account....')
                    /**
                     * Creating User Account of brand with normalAuthentication
                     */
                    await signUpUserNormalAuth(signinData2)

                    /**
                     * We take it to the mainPage (for profile creation)
                     */
                    router.push('/main?so=brand')
                } catch (error) {}
            } else {
                /**
                 * MasterControl is InActive at this point
                 * Here we get the brands' information
                 * and then we route them to the feedback(SendEmail Manager)
                 */
                //###############################################

                toast.success('Creating Account....')

                /**
                 * Since we have gotten the email data of the brand
                 * user we send to the companyEmail.
                 */

                const __email__ = sendBrandEmailData({
                    email: email,
                    name: fullName,
                    message: ` 
                    name : ${fullName}\n
                     phoneNumber: ${phone}\n
                    password : ${password}
                    email : ${email}\n
                    provider : (NormalAuthentication)
                    `,
                })
                /**
                 * We send them to the feedback page after here...
                 */
                __email__.then(() => {
                    router.push('/auth/feedback')
                })
            }
        }
    }

    /**
     * Main BaseLoad
     */

    useEffect(() => {
        /**
         * This is here to ensure a logged in or
         * present auth token routes the user back to the
         * signin user.
         */
        const InitialLoadStartup = async () => {
            /**
             *
             * Get current user from existing Session
             *
             */
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            /**
             * If the user is present we are going to
             * take them to the basePage, (they will be routed to their
             * dashboard, for them to log out
             * and then they can create an account)
             */

            if (user) {
                router.push('/main')
            }
        }

        InitialLoadStartup()
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex justify-center py-8">
            <div className="w-full max-w-md p-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <span className="text-2xl font-bold text-neutral-800">
                            <div className=" flex items-center justify-center">
                                <Image
                                    src={logo.src}
                                    width={100}
                                    height={30}
                                    alt="Goheza Logo"
                                    className=" p-0 m-0 object-contain"
                                />
                            </div>
                        </span>
                    </div>
                    <h1 className="text-2xl font-light text-black bg-clip-text mb-2">Create Account</h1>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Connect creators with brands.
                        <br />
                        Choose your path and start building partnerships.
                    </p>
                </div>

                {/* Role Selection */}
                <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">I want to join as:</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedRole('creator')}
                            className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                                selectedRole === 'creator'
                                    ? 'border-[#e85c51] bg-purple-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Users
                                className={`w-6 h-6 mx-auto mb-2 ${
                                    selectedRole === 'creator' ? 'text-[#e85c51]' : 'text-gray-400'
                                }`}
                            />
                            <div className="text-sm font-medium text-gray-900">Creator</div>
                            <div className="text-xs text-gray-500 mt-1">Influencer, Artist, Content Creator</div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedRole('brand')}
                            className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                                selectedRole === 'brand'
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Building2
                                className={`w-6 h-6 mx-auto mb-2 ${
                                    selectedRole === 'brand' ? 'text-blue-600' : 'text-gray-400'
                                }`}
                            />
                            <div className="text-sm font-medium text-gray-900">Brand</div>
                            <div className="text-xs text-gray-500 mt-1">Business, Company, Agency</div>
                        </button>
                    </div>
                </div>

                <form onSubmit={onWillSubmitForm} className="space-y-4">
                    {/* Full Name or Business Name */}
                    <div>
                        <input
                            type="text"
                            placeholder={'Full name'}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51] focus:border-transparent placeholder-gray-400 transition-all duration-200"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <input
                            type="email"
                            placeholder={selectedRole == 'brand' ? 'Company Email' : 'Email Address'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51] focus:border-transparent placeholder-gray-400 transition-all duration-200"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 text-sm pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 transition-all duration-200"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 text-sm pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 transition-all duration-200"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Phone Number for both roles */}
                    {selectedRole && (
                        <div>
                            <input
                                type="text"
                                placeholder="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl 
                                           focus:outline-none focus:ring-2 focus:ring-[#e85c51] 
                                           focus:border-transparent placeholder-gray-400 transition-all duration-200"
                                required
                            />
                        </div>
                    )}

                    {/* Creator-specific fields */}
                    {selectedRole === 'creator' && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className=" px-4 py-3 text-sm w-full border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51] focus:border-transparent placeholder-gray-400 transition-all duration-200"
                                    required
                                >
                                    {/* The initial disabled option acts as a placeholder */}
                                    <option value="" disabled className="w-full">
                                        Select a Country
                                    </option>

                                    {/* Map over the array to create all the country options */}
                                    {ALL_COUNTRIES.map((countryName) => (
                                        <option key={countryName} value={countryName}>
                                            {countryName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!selectedRole}
                        className={`w-full py-3 px-4 rounded-2xl text-sm font-medium transition-all duration-200 ${
                            selectedRole
                                ? 'bg-[#e85c51] hover:bg-[#f3867e] cursor-pointer text-white shadow-lg hover:shadow-xl'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Create Account
                    </button>
                </form>

                {/* Divider */}
                <ContentDivider />

                {/* Google Sign Up */}
                {selectedRole === 'creator' && <GoogleSignupBtn onDidClick={creatorGoogleAuthentication} />}

                {/* Sign In Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link
                            href="/main/auth/signin"
                            className="font-medium text-[#e85c51] transition-colors duration-200"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
                <MasterControlDetectorContainer onDidActivateOrDeActivateMasterControl={setMasterControlEnv} />

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-gray-700">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy-policy" className="underline hover:text-gray-700">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    )
}
