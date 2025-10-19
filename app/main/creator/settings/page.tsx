'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Define the list of banks for the dropdown
const BANK_OPTIONS = [
    { value: '', label: 'Select Bank Name' },
    { value: 'equity_bank', label: 'Equity Bank' },
    { value: 'kcb_bank', label: 'KCB Bank' },
    { value: 'stanbic_bank', label: 'Stanbic Bank' },
    { value: 'ncba_bank', label: 'NCBA Bank' },
    // Add more banks as needed
]

export default function PaymentPage() {
    // State variables
    const [paymentMethod, setPaymentMethod] = React.useState<'bank' | 'mobile'>('bank')
    const [bankName, setBankName] = React.useState('')
    const [accountNumber, setAccountNumber] = React.useState('')
    const [accountName, setAccountName] = React.useState('')
    const [mobileNumber, setMobileNumber] = React.useState('')
    const [mobileAccountName, setMobileAccountName] = React.useState('')
    const [frequency, setFrequency] = React.useState('weekly')
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true) // NEW: Loading state for fetching data

    // 1. Logic to fetch current saved data
    React.useEffect(() => {
        const fetchPaymentOptions = async () => {
            setIsLoading(true)
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (!user) {
                toast.error('You must be logged in to view payment preferences.')
                setIsLoading(false)
                return
            }

            const { data, error } = await supabaseClient
                .from('creator_profiles')
                .select(
                    `
                        payment_method,
                        payment_bank_name,
                        payment_account_name,
                        payment_account_number,
                        payment_mobilemoney_number,
                        payment_mobilemoney_name,
                        payment_frequency
                    `
                )
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                // PGRST116 means "No rows found"
                console.error('Error fetching payment options:', error)
                toast.error('Failed to load saved payment details.')
            } else if (data) {
                // Pre-populate state with saved data
                setPaymentMethod(data.payment_method || 'bank')

                // Bank details
                setBankName(data.payment_bank_name || '')
                setAccountNumber(data.payment_account_number || '')
                setAccountName(data.payment_account_name || '')

                // Mobile Money details
                setMobileNumber(data.payment_mobilemoney_number || '')
                setMobileAccountName(data.payment_mobilemoney_name || '')

                // Frequency
                setFrequency(data.payment_frequency || 'weekly')
            }

            setIsLoading(false)
        }

        fetchPaymentOptions()
    }, [])

    // 2. Logic to save payment options (Unchanged but included for completeness)
    const savePaymentOptions = async (payload: any) => {
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            toast.error('You must be logged in to save payment preferences.')
            return
        }

        const { error: profileError } = await supabaseClient.from('creator_profiles').upsert(
            {
                user_id: user.id,
                // Note: full_name and email population should ideally be done once on profile creation, but kept here for robustness
                full_name: user.identities?.[0]?.identity_data?.full_name || user.user_metadata?.fullName,
                email: user.email!,
                payment_method: payload.paymentMethod,
                // Bank fields
                payment_bank_name: payload.bankName,
                payment_account_name: payload.accountName,
                payment_account_number: payload.accountNumber,
                // Mobile Money fields
                payment_mobilemoney_number: payload.mobileNumber,
                payment_mobilemoney_name: payload.mobileAccountName,
                payment_frequency: payload.frequency,
                has_payment_details: true,
            },
            {
                onConflict: 'user_id',
                ignoreDuplicates: false,
            }
        )

        if (profileError) {
            console.error('Error saving profile:', profileError)
            toast.error(`Failed to save preferences: ${profileError.message}`)
        } else {
            toast.success('Payment Details Saved Successfully')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const payload = {
            paymentMethod,
            // Only send the relevant fields to avoid conflicts when updating
            bankName: paymentMethod === 'bank' ? bankName : null,
            accountNumber: paymentMethod === 'bank' ? accountNumber : null,
            accountName: paymentMethod === 'bank' ? accountName : null,

            mobileNumber: paymentMethod === 'mobile' ? mobileNumber : null,
            mobileAccountName: paymentMethod === 'mobile' ? mobileAccountName : null,

            frequency,
        }

        await savePaymentOptions(payload)
        setIsSubmitting(false)
    }

    // 3. Render Loading State
    if (isLoading) {
        return (
            <div className="max-w-xl mx-auto py-12 px-6 text-center">
                <h1 className="text-2xl font-bold mb-6">Loading Payment Preferences...</h1>
                <p className="text-gray-500">Please wait.</p>
            </div>
        )
    }

    // 4. Render Form with pre-populated data
    return (
        <div className="max-w-xl mx-auto py-12 px-6">
            <h1 className="text-2xl font-bold mb-6 text-center">Set Your Payment Preferences</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Payment Method */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <div className="flex space-x-4">
                        <Button
                            type="button"
                            variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                            onClick={() => setPaymentMethod('bank')}
                            className="rounded-lg"
                        >
                            Bank
                        </Button>
                        <Button
                            type="button"
                            variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                            onClick={() => setPaymentMethod('mobile')}
                            className="rounded-lg"
                        >
                            Mobile Money
                        </Button>
                    </div>
                </div>

                {/* Bank Fields */}
                {paymentMethod === 'bank' && (
                    <div className="space-y-3">
                        {/* Bank Name Dropdown */}
                        <div>
                            <Input
                                type="text"
                                placeholder="Stanbic Bank"
                                value={accountNumber}
                                onChange={(e) => setBankName(e.target.value)}
                                className="rounded-xl"
                                required
                            />
                            
                        </div>

                        <Input
                            type="text"
                            placeholder="Account Number"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="rounded-xl"
                            required
                        />
                        <Input
                            type="text"
                            placeholder="Account Name"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="rounded-xl"
                            required
                        />
                    </div>
                )}

                {/* Mobile Money Fields */}
                {paymentMethod === 'mobile' && (
                    <div className="space-y-3">
                        <Input
                            type="text"
                            placeholder="Mobile Number (e.g., 07XXXXXXXX)"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="rounded-xl"
                            required
                        />
                        {/* Expected Name Field for Mobile Money */}
                        <Input
                            type="text"
                            placeholder="Expected Name on Mobile Money"
                            value={mobileAccountName}
                            onChange={(e) => setMobileAccountName(e.target.value)}
                            className="rounded-xl"
                            required
                        />
                    </div>
                )}

                {/* Payment Frequency */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">How often would you like to be paid?</Label>
                    <RadioGroup value={frequency} onValueChange={setFrequency} className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="daily" id="daily" />
                            <Label htmlFor="daily">Daily</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="weekly" id="weekly" />
                            <Label htmlFor="weekly">Weekly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="monthly" id="monthly" />
                            <Label htmlFor="monthly">Monthly</Label>
                        </div>
                    </RadioGroup>
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#e85c51] hover:bg-[#d65555] text-white rounded-xl"
                >
                    {isSubmitting ? 'Saving...' : 'Save Preferences'}
                </Button>
            </form>
        </div>
    )
}
