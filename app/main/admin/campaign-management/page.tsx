'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'

type Campaign = {
    id: string
    name: string
    description: string
    requirements: string[]
    payout: string
    budget: string | null
    status: 'inreview' | 'approved' | 'cancelled'
    created_at: string
    created_by: string
    brand_name: string
}

export default function CampaignManagementPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
    const [viewCampaignModal, setViewCampaignModal] = useState(false)
    const [filter, setFilter] = useState('inreview')

    useEffect(() => {
        fetchCampaigns()
    }, [filter])

    const fetchCampaigns = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabaseClient
                .from('campaigns')
                .select(
                    `
                    *,
                    brand_profiles (brand_name)
                `
                )
                .eq('status', filter)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching campaigns:', error)
                toast.error('Failed to load campaigns.')
                return
            }

            const formattedCampaigns = data.map((c: any) => ({
                ...c,
                brand_name: c.brand_profiles?.brand_name || 'N/A',
            }))

            setCampaigns(formattedCampaigns)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (campaignId: string, status: 'approved' | 'cancelled') => {
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            toast.error('Authentication error. Please sign in again.')
            return
        }

        const { error } = await supabaseClient
            .from('campaigns')
            .update({
                status: status,
                reviewed_by: user.id,
                approved_by: status === 'approved' ? user.id : null,
            })
            .eq('id', campaignId)

        if (error) {
            console.error('Error updating campaign status:', error)
            toast.error(`Failed to ${status} campaign.`)
        } else {
            toast.success(`Campaign ${status} successfully!`)
            fetchCampaigns()
            setViewCampaignModal(false)
        }
    }

    const handleViewCampaign = (campaign: Campaign) => {
        setSelectedCampaign(campaign)
        setViewCampaignModal(true)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500/10 text-green-500">Approved</Badge>
            case 'inreview':
                return <Badge className="bg-yellow-500/10 text-yellow-500">In Review</Badge>
            case 'cancelled':
                return <Badge className="bg-red-500/10 text-red-500">Cancelled</Badge>
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
            <h1 className="text-3xl font-bold">Campaign Management</h1>
            <div className="flex justify-start">
                <Tabs
                    value={filter}
                    onValueChange={(value) => setFilter(value as 'inreview' | 'approved' | 'cancelled')}
                >
                    <TabsList>
                        <TabsTrigger value="inreview">Awaiting Review</TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                        <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-xl">{campaign.name}</CardTitle>
                                <div className="text-sm text-neutral-500">
                                    <p>By: {campaign.brand_name}</p>
                                    <p>Created: {format(new Date(campaign.created_at), 'PPP')}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>{getStatusBadge(campaign.status)}</div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-600 font-medium">Payout:</span>
                                    <span className="font-bold text-lg text-[#e85c51]">{campaign.payout}</span>
                                </div>
                                <Button
                                    onClick={() => handleViewCampaign(campaign)}
                                    className="w-full bg-[#e85c51] hover:bg-[#f3867e] text-white"
                                >
                                    View Details
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p className="text-center text-neutral-500 col-span-full">No campaigns found with this status.</p>
                )}
            </div>
            {selectedCampaign && (
                <Dialog open={viewCampaignModal} onOpenChange={setViewCampaignModal}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{selectedCampaign.name}</DialogTitle>
                            <DialogDescription>Details for {selectedCampaign.name}</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 my-4">
                            <p>
                                <strong>Brand:</strong> {selectedCampaign.brand_name}
                            </p>
                            <p>
                                <strong>Status:</strong> {getStatusBadge(selectedCampaign.status)}
                            </p>
                            <p>
                                <strong>Payout:</strong> {selectedCampaign.payout}
                            </p>
                            <p>
                                <strong>Budget:</strong> {selectedCampaign.budget || 'N/A'}
                            </p>
                        </div>
                        <Separator />
                        <div className="my-4">
                            <h3 className="text-lg font-bold mb-2">Description</h3>
                            <p className="text-sm text-neutral-600">{selectedCampaign.description}</p>
                        </div>
                        <div className="my-4">
                            <h3 className="text-lg font-bold mb-2">Requirements</h3>
                            <ul className="list-disc list-inside text-sm text-neutral-600">
                                {selectedCampaign.requirements.map((req, index) => (
                                    <li key={index}>{req}</li>
                                ))}
                            </ul>
                        </div>
                        <DialogFooter className="mt-4">
                            {selectedCampaign.status === 'inreview' && (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleAction(selectedCampaign.id, 'cancelled')}
                                        variant="outline"
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(selectedCampaign.id, 'approved')}
                                        className="bg-[#e85c51] hover:bg-[#f3867e] text-white"
                                    >
                                        Approve
                                    </Button>
                                </div>
                            )}
                            <Button onClick={() => setViewCampaignModal(false)} variant="secondary">
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
