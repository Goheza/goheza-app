'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function PaymentPage() {
    const [paymentMethod, setPaymentMethod] = React.useState<'bank' | 'mobile'>('bank')
    const [accountNumber, setAccountNumber] = React.useState('')
    const [accountName, setAccountName] = React.useState('')
    const [mobileNumber, setMobileNumber] = React.useState('')
    const [frequency, setFrequency] = React.useState('weekly')
    const [isSubmitting, setIsSubmitting] = React.useState(false)

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
                full_name: user.identities![0]?.identity_data?.full_name || user.user_metadata?.fullName,
                email: user.email!,
                payment_method: payload.paymentMethod,
                payment_account_name: payload.accountName,
                payment_account_number: payload.accountNumber,
                payment_frequency: payload.frequency,
                payment_mobilemoney_number: payload.mobileNumber,
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
            accountNumber: paymentMethod === 'bank' ? accountNumber : null,
            accountName: paymentMethod === 'bank' ? accountName : null,
            mobileNumber: paymentMethod === 'mobile' ? mobileNumber : null,
            frequency,
        }

        await savePaymentOptions(payload)
        setIsSubmitting(false)
    }

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

                {/* Mobile Money Field */}
                {paymentMethod === 'mobile' && (
                    <Input
                        type="text"
                        placeholder="Mobile Number"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="rounded-xl"
                        required
                    />
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
