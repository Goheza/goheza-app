'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { FileDown, DollarSign } from 'lucide-react'

// You will need to create a function to generate the PDF on the server-side
// For now, this is a placeholder
const generateInvoicePDF = async (invoiceData: any) => {
    toast.info('Generating invoice PDF...')
    // In a real application, you would make an API call to a serverless function
    // or a backend route that uses a library like 'html-pdf' or 'puppeteer' to create the PDF.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    toast.success('Invoice PDF generated! (Placeholder)')
    // The real function would return a file URL or a Blob
    return 'https://goheza.com/invoices/invoice-123.pdf'
}

type Payment = {
    id: string
    amount: string // Corrected type to string
    description: string
    type: 'invoice' | 'payout'
    status: 'paid' | 'pending' | 'overdue'
    created_at: string
    recipient_name: string
    recipient_email: string
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('invoices')

    useEffect(() => {
        fetchPayments()
    }, [filter])

    const fetchPayments = async () => {
        setLoading(true)
        try {
            if (filter === 'invoices') {
                const { data: campaigns, error } = await supabaseClient
                    .from('campaigns')
                    .select(
                        `
                        id,
                        name,
                        payout,
                        created_at,
                        brand_profiles (brand_name, brand_email)
                    `
                    )
                    .eq('status', 'approved')
                    .limit(5)

                if (error) {
                    console.error('Error fetching invoices:', error)
                    toast.error('Failed to load invoices.')
                    return
                }

                const invoices = campaigns.map((c: any) => ({
                    id: c.id,
                    amount: c.payout || 'N/A', // Corrected to use the text value directly
                    description: `Invoice for campaign: ${c.name}`,
                    type: 'invoice' as const,
                    status: Math.random() > 0.5 ? 'paid' : 'pending', // Mock status
                    created_at: c.created_at,
                    recipient_name: c.brand_profiles?.brand_name || 'N/A',
                    recipient_email: c.brand_profiles?.brand_email || 'N/A',
                }))
                //@ts-ignore
                setPayments(invoices)
            } else if (filter === 'payouts') {
                const { data: submissions, error } = await supabaseClient
                    .from('campaign_submissions')
                    .select(
                        `
                        id,
                        campaigns(name, payout),
                        creator_profiles(full_name, email)
                    `
                    )
                    .eq('status', 'approved')
                    .limit(5)

                if (error) {
                    console.error('Error fetching payouts:', error)
                    toast.error('Failed to load payouts.')
                    return
                }

                const payouts = submissions.map((s: any) => ({
                    id: s.id,
                    amount: s.campaigns?.payout || 'N/A', // Corrected to use the text value
                    description: `Payout for submission: ${s.campaigns?.name}`,
                    type: 'payout' as const,
                    status: 'pending' as const, // Mock status
                    created_at: s.submitted_at,
                    recipient_name: s.creator_profiles?.full_name || 'N/A',
                    recipient_email: s.creator_profiles?.email || 'N/A',
                }))
                setPayments(payouts)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (payment: Payment) => {
        const invoiceData = {
            id: payment.id,
            recipient: payment.recipient_name,
            amount: payment.amount,
            description: payment.description,
            date: payment.created_at,
        }
        await generateInvoicePDF(invoiceData)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-500/10 text-green-500">Paid</Badge>
            case 'pending':
                return <Badge className="bg-yellow-500/10 text-yellow-500">Pending</Badge>
            case 'overdue':
                return <Badge className="bg-red-500/10 text-red-500">Overdue</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Payments</h1>
            <Tabs value={filter} onValueChange={setFilter}>
                <TabsList>
                    <TabsTrigger value="invoices">Brand Invoices</TabsTrigger>
                    <TabsTrigger value="payouts">Creator Payouts</TabsTrigger>
                </TabsList>
                <TabsContent value={filter} className="mt-4">
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>Recipient</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length > 0 ? (
                                    payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">{payment.recipient_name}</TableCell>
                                            <TableCell>{payment.description}</TableCell>
                                            <TableCell className="font-bold text-[#e85c51]">
                                                <DollarSign className="inline h-4 w-4 mr-1" />
                                                {payment.amount}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                            <TableCell>{format(new Date(payment.created_at), 'PPP')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    onClick={() => handleDownload(payment)}
                                                    variant="ghost"
                                                    className="bg-[#e85c51]/10 text-[#e85c51] hover:bg-[#e85c51]/20"
                                                >
                                                    <FileDown className="h-4 w-4 mr-2" />
                                                    Download
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-neutral-500">
                                            No payments found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
