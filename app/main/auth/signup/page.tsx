/**
 * Goheza Sign Up Form - Connecting Creators to Brands
 * Allows users to sign up as either a Creator or Brand
 */
'use client'
import React, { useEffect, useState } from 'react'
import { Eye, EyeOff, Users, Building2 } from 'lucide-react'
import Link from 'next/link'
import { signUpUser } from '@/lib/supabase/auth/signup'
import { AuthError } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { baseURL } from '@/lib/env'
import { signInWithGoogle } from '@/lib/supabase/auth/signin'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import logo from '@/assets/GOHEZA-02.png'
import { supabaseClient } from '@/lib/supabase/client'
import { signInWithGoogleBrand } from '@/lib/supabase/auth/signupGoogleBrand'
import { sendBrandEmailData } from '@/lib/brand/send-brand-data'
import { useMasterControlStore } from '@/lib/masterKey/masterControl'
import { useMasterKeyListener } from '@/lib/masterKey/masterKey'
import MasterControlDialog from '@/lib/masterKey/masterDialog'

type UserRole = 'creator' | 'brand' | null

export const ALL_COUNTRIES = [
    'Afghanistan',
    'Albania',
    'Algeria',
    'Andorra',
    'Angola',
    'Antigua and Barbuda',
    'Argentina',
    'Armenia',
    'Australia',
    'Austria',
    'Azerbaijan',
    'Bahamas',
    'Bahrain',
    'Bangladesh',
    'Barbados',
    'Belarus',
    'Belgium',
    'Belize',
    'Benin',
    'Bhutan',
    'Bolivia',
    'Bosnia and Herzegovina',
    'Botswana',
    'Brazil',
    'Brunei',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Cabo Verde',
    'Cambodia',
    'Cameroon',
    'Canada',
    'Central African Republic',
    'Chad',
    'Chile',
    'China',
    'Colombia',
    'Comoros',
    'Congo (Congo-Brazzaville)',
    'Costa Rica',
    'Croatia',
    'Cuba',
    'Cyprus',
    'Czechia (Czech Republic)',
    'Democratic Republic of the Congo',
    'Denmark',
    'Djibouti',
    'Dominica',
    'Dominican Republic',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Estonia',
    'Eswatini (fmr. Swaziland)',
    'Ethiopia',
    'Fiji',
    'Finland',
    'France',
    'Gabon',
    'Gambia',
    'Georgia',
    'Germany',
    'Ghana',
    'Greece',
    'Grenada',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Holy See',
    'Honduras',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Iran',
    'Iraq',
    'Ireland',
    'Israel',
    'Italy',
    'Ivory Coast',
    'Jamaica',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kiribati',
    'Kuwait',
    'Kyrgyzstan',
    'Laos',
    'Latvia',
    'Lebanon',
    'Lesotho',
    'Liberia',
    'Libya',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Malta',
    'Marshall Islands',
    'Mauritania',
    'Mauritius',
    'Mexico',
    'Micronesia',
    'Moldova',
    'Monaco',
    'Mongolia',
    'Montenegro',
    'Morocco',
    'Mozambique',
    'Myanmar (formerly Burma)',
    'Namibia',
    'Nauru',
    'Nepal',
    'Netherlands',
    'New Zealand',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'North Korea',
    'North Macedonia (formerly Macedonia)',
    'Norway',
    'Oman',
    'Pakistan',
    'Palau',
    'Palestine State',
    'Panama',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines',
    'Poland',
    'Portugal',
    'Qatar',
    'Romania',
    'Russia',
    'Rwanda',
    'Saint Kitts and Nevis',
    'Saint Lucia',
    'Saint Vincent and the Grenadines',
    'Samoa',
    'San Marino',
    'Sao Tome and Principe',
    'Saudi Arabia',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leone',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'South Korea',
    'South Sudan',
    'Spain',
    'Sri Lanka',
    'Sudan',
    'Suriname',
    'Sweden',
    'Switzerland',
    'Syria',
    'Tajikistan',
    'Tanzania',
    'Thailand',
    'Timor-Leste',
    'Togo',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Tuvalu',
    'Uganda',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'United States of America',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Venezuela',
    'Vietnam',
    'Yemen',
    'Zambia',
    'Zimbabwe',
]

export default function SignUpForm() {
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [confirmPassword, setConfirmPassword] = useState<string>('')
    const [fullName, setFullName] = useState<string>('')
    const [selectedRole, setSelectedRole] = useState<UserRole>(null)
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)

    // Shared field
    const [phone, setPhone] = useState<string>('')

    // Creator-specific fields
    const [country, setCountry] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<string>('Unknown')
    const [socialLinks, setSocialLinks] = useState<string>('')

    const router = useRouter()


        /**Masterkey manager */
    
        // Local state to manage the *dialog visibility* for a brief period
        const [isDialogVisible, setIsDialogVisible] = useState(false)
    
        const { isMasterControlActiv, resetControlt,activateControl } = useMasterControlStore();
    
        /**
         * For the state manager
         * @param message 
         * @param description 
         * @param type 
         */
    
        const [isActive,resetControl] = useMasterKeyListener()





    useEffect(() => {

        const MasterControlManaer = ()=>{
                 //masterKeyManagement:
            
                    if (isActive) {
                        // The global variable is activated
            
                        
            
                        activateControl()
            
                        // Show the small dialog
                        setIsDialogVisible(true)
            
                        // Hide the dialog after 3 seconds
                        const timer = setTimeout(() => {
                            setIsDialogVisible(false)
                        }, 3000)
            
                        // OPTIONAL: Auto-reset the global variable after 10 seconds
                        // if you want the user to type the code again for security/control.
                        const controlResetTimer = setTimeout(() => {
                            resetControl()
                            resetControlt()
                        }, 10000)
            
                        return () => {
                            clearTimeout(timer)
                            // clearTimeout(controlResetTimer);
                        }
                    }
        }

        MasterControlManaer()

        const InitaliStartup = async () => {
            /**
             * Check if there is existing user before allowing them to come to this page
             */
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()
            if (user) {
                /**
                 * If there is a user present, we take them to autoLogin
                 */
                router.push('/main')
            }
        }
        InitaliStartup()
    }, [router,isMasterControlActiv, resetControlt,isActive,resetControl])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!selectedRole) {
            toast.info('Please select your role', { style: { fontSize: 14, padding: 10 } })
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords don't match", { style: { fontSize: 14, padding: 10 } })
            return
        }

        // Validation
        if (selectedRole === 'creator') {
            if (!phone || !country) {
                console.log('phone', phone)
                console.log('country', country)

                toast.error('Please fill in all required fields for Creator.', {
                    style: { fontSize: 14, padding: 10 },
                })
                return
            }

            try {
                router.push('/main/z1i2n')
                signUpUser({
                    email,
                    password,
                    fullName,
                    role: selectedRole,
                    phone,
                    country,
                    paymentMethod,
                    socialLinks,
                }).then((args) => {
                    if (args.isErrorTrue) {
                        toast.error('Sign Up Failed', {
                            style: { fontSize: 14, padding: 10 },
                            description: 'Account Already Present with another Email or Name',
                        })
                    } else {
                        toast.success('Welcome to Goheza!', {
                            style: { fontSize: 14, padding: 10 },
                            description: `Account created successfully as ${selectedRole}.`,
                        })
                        router.push(`/main/auth/verification?email=${encodeURIComponent(email)}`)
                    }
                })
            } catch (error) {
                console.error('Sign up error:', error)
            }
        } else {
            if (!phone) {
                toast.error('Please provide a phone number for your Brand.', {
                    style: { fontSize: 14, padding: 10 },
                })
                return
            }

            /**
             *
             * -------------------------------------------------------------------------------
             * MASTER-CONTROL-VARIABLE
             * -------------------------------------------------------------------------------
             */

          

            if (isActive) {
                try {
                    router.push('/main/z1i2n')
                    signUpUser({
                        email,
                        password,
                        fullName,
                        role: selectedRole,
                        phone,
                        country,
                        paymentMethod,
                        socialLinks,
                    }).then((args) => {
                        if (args.isErrorTrue) {
                            toast.error('Sign Up Failed', {
                                style: { fontSize: 14, padding: 10 },
                                description: 'Account Already Present with another Email or Name',
                            })
                        } else {
                            toast.success('Welcome to Goheza!', {
                                style: { fontSize: 14, padding: 10 },
                                description: `Account created successfully as ${selectedRole}.`,
                            })
                            router.push(`/main/auth/verification?email=${encodeURIComponent(email)}`)
                        }
                    })
                } catch (error) {
                    console.error('Sign up error:', error)
                }
            } else {
                /**
                 * @@@ At this point its the brand
                 * We want to first send an Email of the persons data to us before we go forward here
                 */
                toast.success('Processing Application...')
                sendBrandEmailData({
                    email: email,
                    name: fullName,
                    message: ` 
                
                    name : ${fullName}\n
                    phoneNumber: ${phone}\n
                    password : ${password}
                    email : ${email}\n
                    provider : (NormalAuthentication)
                
                
                `,
                }).then(() => {
                    router.push(`${baseURL}/main/feedback?provider=agent`)
                })
            }
        }
    }

    const handleGoogleSignUp = () => {
        if (!selectedRole) {
            toast('Please select your role first', { style: { fontSize: 14, padding: 10 } })
            return
        }

        /**
         *
         * @@@NewLogics
         *  IF the role is of a brand,then when they select google we're just going to redirect them to the other
         * page Because we want to get their information, but at this point, we need to be able to create the account if they ever choose
         * google,
         *
         */

        /**
         *
         * -------------------------------------------------------------------------------
         * MASTER-CONTROL-VARIABLE
         * -------------------------------------------------------------------------------
         */


        if (selectedRole == 'brand') {
            //check if variable is online to enable us create the account
            if (isActive) {
                /**
                 * Master control variable is present
                 * so we can create an account with google
                 */
                try {
                    signInWithGoogle({
                        redirectURL: `${baseURL}/main?role=${selectedRole}`,
                    })
                } catch (error) {
                    if (error && error instanceof AuthError) {
                        console.log('Error Signing Up with Google', error.message)
                    }
                }
            } else {
                /**
                 * Master control variable is absend
                 * so we just need to send an application for the brand
                 */
                try {
                    signInWithGoogleBrand({
                        redirectURL: `${baseURL}/main/feedback?provider=google`,
                    })
                } catch (error) {
                    if (error && error instanceof AuthError) {
                        console.log('Error Signing Up with Google', error.message)
                    }
                }
            }
        } else {
            try {
                signInWithGoogle({
                    redirectURL: `${baseURL}/main?role=${selectedRole}`,
                })
            } catch (error) {
                if (error && error instanceof AuthError) {
                    console.log('Error Signing Up with Google', error.message)
                }
            }
        }
    }

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

                <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="my-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-gray-500">OR</span>
                        </div>
                    </div>
                </div>

                {/* Google Sign Up */}
                <button
                    onClick={handleGoogleSignUp}
                    className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all duration-200 group"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Continue with Google</span>
                </button>

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
                <MasterControlDialog isVisible={isDialogVisible} />


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
