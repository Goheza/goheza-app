'use client'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CheckCircle, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'

// --- 1. TYPE DEFINITIONS ---

type SocialAccount = {
    user_id: string
    platform: string
    username: string | null
    connected_at: string | null
}

type CreatorProfileDB = {
    user_id: string
    id: string
    email: string
    full_name: string
    created_at: string
    phone: string | null
    country: string | null
    payment_method: string | null
    payment_account_name: string | null
    payment_account_number: string | null
    payment_frequency: string | null
    payment_mobilemoney_number: string | null
    has_payment_details: boolean
}

type BrandProfileDB = {
    user_id: string
    id: string
    brand_email: string
    brand_name: string
    created_at: string
    phone: string | null
    is_verified: boolean
}

type TikTokInfo = {
    connected: boolean
    username: string | null
    connected_at: string | null
}

type UserProfile = {
    id: string
    user_id: string
    email: string
    role: 'creator' | 'brand'
    name: string
    created_at: string
    is_active: boolean
    contact?: string | null
    is_verified?: boolean
    phone?: string | null
    country?: string | null
    payment_method?: string | null
    payment_account_name?: string | null
    payment_account_number?: string | null
    payment_frequency?: string | null
    payment_mobilemoney_number?: string | null
    has_payment_details?: boolean
    tiktok?: TikTokInfo
}

// --- 2. MAPPER FUNCTIONS ---

const mapCreatorToUserProfile = (creator: CreatorProfileDB, tiktokMap: Record<string, SocialAccount>): UserProfile => {
    const tiktokAccount = tiktokMap[creator.user_id]
    return {
        id: creator.id,
        user_id: creator.user_id,
        email: creator.email,
        role: 'creator',
        name: creator.full_name,
        created_at: creator.created_at,
        is_active: true,
        phone: creator.phone,
        country: creator.country,
        payment_method: creator.payment_method,
        payment_account_name: creator.payment_account_name,
        payment_account_number: creator.payment_account_number,
        payment_frequency: creator.payment_frequency,
        payment_mobilemoney_number: creator.payment_mobilemoney_number,
        has_payment_details: creator.has_payment_details,
        tiktok: tiktokAccount
            ? {
                  connected: true,
                  username: tiktokAccount.username,
                  connected_at: tiktokAccount.connected_at,
              }
            : { connected: false, username: null, connected_at: null },
    }
}

const mapBrandToUserProfile = (brand: BrandProfileDB): UserProfile => ({
    id: brand.id,
    user_id: brand.user_id,
    email: brand.brand_email,
    role: 'brand',
    name: brand.brand_name,
    created_at: brand.created_at,
    is_active: true,
    contact: brand.phone,
    is_verified: brand.is_verified,
})

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [filter, setFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [viewProfileModal, setViewProfileModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const creatorSelectFields =
                'id, email, full_name, user_id, created_at, phone, country, payment_method, payment_account_name, payment_account_number, payment_frequency, payment_mobilemoney_number, has_payment_details'
            const brandSelectFields = 'id, user_id, brand_email, brand_name, created_at, contact, is_verified, phone'

            const [
                { data: creators, error: creatorError },
                { data: brands, error: brandError },
                { data: tiktokAccounts, error: tiktokError },
            ] = await Promise.all([
                supabaseClient.from('creator_profiles').select(creatorSelectFields).returns<CreatorProfileDB[]>(),
                supabaseClient.from('brand_profiles').select(brandSelectFields).returns<BrandProfileDB[]>(),
                supabaseClient
                    .from('social_accounts')
                    .select('user_id, platform, username, connected_at')
                    .eq('platform', 'tiktok')
                    .returns<SocialAccount[]>(),
            ])

            if (creatorError || brandError || tiktokError) {
                console.error('Error fetching users:', creatorError || brandError || tiktokError)
                toast.error('Failed to load users. Please check the database connection.')
                return
            }

            // Build a quick lookup map: user_id -> tiktok account
            const tiktokMap: Record<string, SocialAccount> = {}
            for (const account of tiktokAccounts || []) {
                tiktokMap[account.user_id] = account
            }

            const creatorProfiles: UserProfile[] = (creators || []).map((c) => mapCreatorToUserProfile(c, tiktokMap))
            const brandProfiles: UserProfile[] = (brands || []).map(mapBrandToUserProfile)

            setUsers([...creatorProfiles, ...brandProfiles])
        } catch (e) {
            console.error('An unexpected error occurred:', e)
            toast.error('An unexpected error occurred while fetching user data.')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyBrand = async (brand: UserProfile) => {
        if (brand.role !== 'brand') return
        setIsUpdating(true)
        const toastId = toast.loading(`Verifying ${brand.name}...`)
        try {
            const { error } = await supabaseClient
                .from('brand_profiles')
                .update({ is_verified: true })
                .eq('id', brand.id)
                .single()
            if (error) throw new Error(error.message)
            setUsers((prevUsers) => prevUsers.map((u) => (u.id === brand.id ? { ...u, is_verified: true } : u)))
            setViewProfileModal(false)
            setSelectedUser(null)
            toast.success(`${brand.name} is now verified!`, { id: toastId })
        } catch (e: any) {
            console.error('Error verifying brand:', e)
            toast.error(`Verification failed: ${e.message || 'Database error.'}`, { id: toastId })
        } finally {
            setIsUpdating(false)
        }
    }

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filter === 'all' || user.role === filter
        return matchesSearch && matchesFilter
    })

    const handleViewProfile = (user: UserProfile) => {
        setSelectedUser(user)
        setViewProfileModal(true)
    }

    const deleteUserFlow = async (user_id: string, role: 'brand' | 'creator') => {
        const loadingToastId = toast.loading('Deleting user…')
        try {
            const res = await fetch('/api/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id, role }),
            })
            const data = await res.json()
            toast.dismiss(loadingToastId)
            if (!res.ok) {
                toast.error(`Failed to delete user, ${data.error} || 'Unknown error'`)
                return
            }
            toast.success(
                <>
                    <span style={{ fontWeight: 700 }}>User deleted</span>
                    <div style={{ opacity: 1, fontSize: '0.9rem' }}>{data.message}</div>
                </>,
                { duration: 5000 }
            )
            fetchUsers()
        } catch (err: any) {
            toast.dismiss(loadingToastId)
            toast.error('Error deleting user', { description: err?.message || 'Unknown error' })
        }
    }

    const handleToggleStatus = async (user: UserProfile) => {
        try {
            toast.error(`Delete User? This action is permanent and cannot be undone.`, {
                duration: Infinity,
                action: { label: 'Delete', onClick: () => deleteUserFlow(user.user_id, user.role) },
                cancel: { label: 'Cancel', onClick: () => {} },
            })
        } catch (error) {}
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 text-[#e85c51] animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">User Management</h1>

            <div className="flex justify-between items-center">
                <Input
                    placeholder="Search users by name or email..."
                    className="max-w-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Tabs value={filter} onValueChange={setFilter}>
                    <TabsList>
                        <TabsTrigger value="all">All Users</TabsTrigger>
                        <TabsTrigger value="creator">Creators</TabsTrigger>
                        <TabsTrigger value="brand">Brands</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>TikTok</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`capitalize ${
                                                user.role === 'creator'
                                                    ? 'bg-[#e85c51]/10 text-[#e85c51]'
                                                    : 'bg-blue-500/10 text-blue-500'
                                            }`}
                                        >
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {user.role === 'creator' ? user.phone || 'N/A' : user.contact || 'N/A'}
                                    </TableCell>

                                    {/* TikTok Column */}
                                    <TableCell>
                                        {user.role === 'creator' ? (
                                            user.tiktok?.connected ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <Badge className="bg-black text-white w-fit text-xs px-2 py-0.5">
                                                        ✓ Connected
                                                    </Badge>
                                                    {user.tiktok.username && (
                                                        <span className="text-xs text-gray-500">
                                                            @{user.tiktok.username}
                                                        </span>
                                                    )}
                                                    {user.tiktok.connected_at && (
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(user.tiktok.connected_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="text-gray-400 border-gray-200 text-xs"
                                                >
                                                    Not connected
                                                </Badge>
                                            )
                                        ) : (
                                            <span className="text-gray-300 text-sm">—</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {user.role === 'brand' ? (
                                            <Badge
                                                variant="secondary"
                                                className={`flex items-center gap-1 ${
                                                    user.is_verified
                                                        ? 'bg-green-500/10 text-green-500'
                                                        : 'bg-yellow-500/10 text-yellow-500'
                                                }`}
                                            >
                                                {user.is_verified ? (
                                                    <CheckCircle className="h-3 w-3" />
                                                ) : (
                                                    <Clock className="h-3 w-3" />
                                                )}
                                                {user.is_verified ? 'Verified' : 'Pending'}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className={`${
                                                    user.is_active
                                                        ? 'bg-green-500/10 text-green-500'
                                                        : 'bg-red-500/10 text-red-500'
                                                }`}
                                            >
                                                {user.is_active ? 'Active' : 'Suspended'}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                                                    View Profile
                                                </DropdownMenuItem>
                                                {user.role === 'brand' && !user.is_verified && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleVerifyBrand(user)}
                                                        className="text-green-600 font-medium"
                                                        disabled={isUpdating}
                                                    >
                                                        {isUpdating ? 'Verifying...' : '✅ Mark as Verified'}
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                                    Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-neutral-500">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View Profile Modal */}
            {selectedUser && (
                <Dialog open={viewProfileModal} onOpenChange={setViewProfileModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="capitalize flex items-center gap-3">
                                {selectedUser.name}
                                {selectedUser.role === 'brand' && (
                                    <Badge
                                        className={`capitalize ${
                                            selectedUser.is_verified
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-yellow-500/10 text-yellow-500'
                                        }`}
                                    >
                                        {selectedUser.is_verified ? 'Verified' : 'Pending'}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription>{selectedUser.role} Profile Details</DialogDescription>
                        </DialogHeader>
                        <Separator className="my-4" />
                        <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto pr-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <p>
                                    <strong>Email:</strong>
                                </p>
                                <p>{selectedUser.email}</p>
                                <p>
                                    <strong>Joined:</strong>
                                </p>
                                <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                            </div>

                            {selectedUser.role === 'creator' && (
                                <>
                                    <Separator className="!mt-4 !mb-4" />
                                    <h4 className="font-bold text-base text-gray-700">Contact & Location</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        <p>
                                            <strong>Phone:</strong>
                                        </p>
                                        <p>{selectedUser.phone || 'N/A'}</p>
                                        <p>
                                            <strong>Country:</strong>
                                        </p>
                                        <p>{selectedUser.country || 'N/A'}</p>
                                    </div>

                                    {/* TikTok Section in Modal */}
                                    <Separator className="!mt-4 !mb-4" />
                                    <h4 className="font-bold text-base text-gray-700">TikTok Account</h4>
                                    {selectedUser.tiktok?.connected ? (
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <p>
                                                <strong>Status:</strong>
                                            </p>
                                            <Badge className="bg-black text-white w-fit text-xs">✓ Connected</Badge>
                                            <p>
                                                <strong>Username:</strong>
                                            </p>
                                            <p>
                                                {selectedUser.tiktok.username
                                                    ? `@${selectedUser.tiktok.username}`
                                                    : 'N/A'}
                                            </p>
                                            <p>
                                                <strong>Connected On:</strong>
                                            </p>
                                            <p>
                                                {selectedUser.tiktok.connected_at
                                                    ? new Date(selectedUser.tiktok.connected_at).toLocaleDateString()
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">No TikTok account connected.</p>
                                    )}

                                    <Separator className="!mt-4 !mb-4" />
                                    <h4 className="font-bold text-base text-gray-700">Payment Information</h4>
                                    {selectedUser.has_payment_details ? (
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <p>
                                                <strong>Method:</strong>
                                            </p>
                                            <p>{selectedUser.payment_method || 'N/A'}</p>
                                            <p>
                                                <strong>Account Name:</strong>
                                            </p>
                                            <p>{selectedUser.payment_account_name || 'N/A'}</p>
                                            <p>
                                                <strong>Account/Mobile No:</strong>
                                            </p>
                                            <p>
                                                {selectedUser.payment_method === 'Mobile Money'
                                                    ? selectedUser.payment_mobilemoney_number || 'N/A'
                                                    : selectedUser.payment_account_number || 'N/A'}
                                            </p>
                                            <p>
                                                <strong>Frequency:</strong>
                                            </p>
                                            <p>{selectedUser.payment_frequency || 'N/A'}</p>
                                        </div>
                                    ) : (
                                        <p className="text-red-500 italic">
                                            ⚠️ Creator has not yet set up payment details.
                                        </p>
                                    )}
                                </>
                            )}

                            {selectedUser.role === 'brand' && (
                                <>
                                    <Separator className="!mt-4 !mb-4" />
                                    <h4 className="font-bold text-base text-gray-700">Brand Contact</h4>
                                    <p>
                                        <strong>Primary Contact:</strong> {selectedUser.contact || 'N/A'}
                                    </p>
                                    {!selectedUser.is_verified && (
                                        <div className="pt-4">
                                            <Button
                                                onClick={() => handleVerifyBrand(selectedUser)}
                                                className="w-full bg-green-500 hover:bg-green-600"
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                )}
                                                {isUpdating ? 'Verifying...' : 'Mark as Verified'}
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
