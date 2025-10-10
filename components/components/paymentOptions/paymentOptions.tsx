'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface IPaymentDialogProps {
    isPaymentDialogOpen: boolean
    setPaymentDialogOpen(vl: boolean): void
}

// Hardcoded list of common banks for the dropdown
const COMMON_BANKS = ['KCB Bank', 'Equity Bank', 'Stanbic Bank', 'NCBA Bank']

export default function PaymentDialog(props: IPaymentDialogProps) {
    const [paymentMethod, setPaymentMethod] = React.useState<'bank' | 'mobile'>('bank')
    const [bankName, setBankName] = React.useState(COMMON_BANKS[0] || '') // ⬅️ UPDATED: Initialize with the first bank
    const [accountNumber, setAccountNumber] = React.useState('')
    const [accountName, setAccountName] = React.useState('')
    const [mobileNumber, setMobileNumber] = React.useState('')
    const [mobileAccountName, setMobileAccountName] = React.useState('') // ⬅️ NEW STATE: Mobile Money Expected Name
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
                // Bank fields
                payment_bank_name: payload.bankName, // ⬅️ UPDATED: Save Bank Name
                payment_account_name: payload.accountName,
                payment_account_number: payload.accountNumber,
                // Mobile Money fields
                payment_mobilemoney_number: payload.mobileNumber,
                payment_mobilemoney_name: payload.mobileAccountName, // ⬅️ UPDATED: Save Mobile Money Expected Name

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
            // Optionally close the dialog after successful save
            props.setPaymentDialogOpen(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Basic validation
        if (paymentMethod === 'bank' && (!bankName || !accountNumber || !accountName)) {
            toast.error('Please fill in all required bank details.')
            setIsSubmitting(false)
            return
        }

        if (paymentMethod === 'mobile' && (!mobileNumber || !mobileAccountName)) {
            toast.error('Please fill in all required mobile money details.')
            setIsSubmitting(false)
            return
        }

        const payload = {
            paymentMethod,
            // Bank fields (only included if paymentMethod is 'bank')
            bankName: paymentMethod === 'bank' ? bankName : null,
            accountNumber: paymentMethod === 'bank' ? accountNumber : null,
            accountName: paymentMethod === 'bank' ? accountName : null,
            // Mobile Money fields (only included if paymentMethod is 'mobile')
            mobileNumber: paymentMethod === 'mobile' ? mobileNumber : null,
            mobileAccountName: paymentMethod === 'mobile' ? mobileAccountName : null,

            frequency,
        }

        await savePaymentOptions(payload)
        setIsSubmitting(false)
    }

    return (
        <Dialog open={props.isPaymentDialogOpen} onOpenChange={props.setPaymentDialogOpen}>
            {/* Removed DialogTrigger as it's typically controlled by the parent component via props */}
            <DialogContent className="sm:max-w-[500px] rounded-2xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Payment Preferences</DialogTitle>
                </DialogHeader>

                <form className="space-y-6" onSubmit={handleSubmit}>
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
                                Bank Transfer
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

                    {/* Bank fields (Bank Name added as Dropdown) */}
                    {paymentMethod === 'bank' && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="bank-name">Bank Name</Label>
                                <select
                                    id="bank-name"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    {COMMON_BANKS.map((bank) => (
                                        <option key={bank} value={bank}>
                                            {bank}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                type="text"
                                placeholder="Account Name (e.g., Jane Doe)"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                className="rounded-xl"
                                required
                            />
                            <Input
                                type="text"
                                placeholder="Account Number"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                className="rounded-xl"
                                required
                            />
                        </div>
                    )}

                    {/* Mobile Money fields (Expected Name added) */}
                    {paymentMethod === 'mobile' && (
                        <div className="space-y-3">
                            <Input
                                type="tel"
                                placeholder="Mobile Number (e.g., +2547XXXXXXXX)"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                className="rounded-xl"
                                required
                            />
                            <Input // ⬅️ NEW INPUT FIELD
                                type="text"
                                placeholder="Expected Name on Mobile Account"
                                value={mobileAccountName}
                                onChange={(e) => setMobileAccountName(e.target.value)}
                                className="rounded-xl"
                                required
                            />
                        </div>
                    )}

                    {/* Payment Frequency */}
                    <div className="space-y-3 pt-2">
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
            </DialogContent>
        </Dialog>
    )
}
