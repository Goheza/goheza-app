'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function PaymentDialog() {
    const [paymentMethod, setPaymentMethod] = React.useState<'bank' | 'mobile'>('bank')
    const [accountNumber, setAccountNumber] = React.useState('')
    const [accountName, setAccountName] = React.useState('')
    const [mobileNumber, setMobileNumber] = React.useState('')
    const [frequency, setFrequency] = React.useState('weekly')
    const [hasInstagram, setHasInstagram] = React.useState(false)
    const [hasTiktok, setHasTiktok] = React.useState(false)

    const savePaymentOptions = async (payload:any) => {
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (user) {
            const { error: profileError } = await supabaseClient.from('creator_profiles').insert([
                {
                    user_id: user.id,
                    full_name: user.identities![0]?.identity_data?.full_name || user.user_metadata?.fullName,
                    email: user.email!,
                    payment_method: payload.paymentMethod,
                    payment_account_name: payload.accountName,
                    payment_account_number: payload.accountNumber,
                    payment_frequency: payload.frequency,
                    payment_mobilemoney_number: payload.mobileNumber,
                    has_instagram: payload.hasInstagram,
                    has_tiktok: payload.hasTiktok,
                },
            ])

            if (profileError) {
                console.error("Error saving profile:", profileError)
                toast.error("Failed to save preferences.")
            } else {
                toast.success("Payment Details Saved Successfully")
            }
        }
    }

    const handleSubmit = async () => {
        const payload = {
            paymentMethod,
            accountNumber: paymentMethod === 'bank' ? accountNumber : undefined,
            accountName: paymentMethod === 'bank' ? accountName : undefined,
            mobileNumber: paymentMethod === 'mobile' ? mobileNumber : undefined,
            frequency,
            hasInstagram,
            hasTiktok,
        }
        await savePaymentOptions(payload)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className='space-x-3'>
                    <Button className="border bg-transparent text-[#e85c51] border-[#e85c51] rounded-xl">
                        Set Account Preferences 
                    </Button>
                    <span className='text-sm text-neutral-400'>Asked Only Once!</span>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Payment Preferences</DialogTitle>
                </DialogHeader>

                {/* Payment Method Switch */}
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

                {/* Bank fields */}
                {paymentMethod === 'bank' && (
                    <div className="space-y-3 mt-3">
                        <Input
                            type="text"
                            placeholder="Account Number"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="rounded-xl"
                        />
                        <Input
                            type="text"
                            placeholder="Account Name"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>
                )}

                {/* Mobile field */}
                {paymentMethod === 'mobile' && (
                    <div className="mt-3">
                        <Input
                            type="text"
                            placeholder="Mobile Number"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>
                )}

                {/* Payment Frequency */}
                <div className="space-y-3 mt-4">
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

                {/* Social Buttons */}
                <div className="mt-4 space-y-3">
                    <Label className="text-sm font-medium">Which social media accounts do you have?</Label>
                    <div className="flex space-x-4">
                        <Button
                            type="button"
                            variant={hasInstagram ? 'default' : 'outline'}
                            onClick={() => setHasInstagram(!hasInstagram)}
                            className="rounded-lg"
                        >
                            Instagram
                        </Button>
                        <Button
                            type="button"
                            variant={hasTiktok ? 'default' : 'outline'}
                            onClick={() => setHasTiktok(!hasTiktok)}
                            className="rounded-lg"
                        >
                            TikTok
                        </Button>
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    className="w-full mt-6 bg-[#e85c51] hover:bg-[#d65555] text-white rounded-xl"
                >
                    Save Preferences
                </Button>
            </DialogContent>
        </Dialog>
    )
}