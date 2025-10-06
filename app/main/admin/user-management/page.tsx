// @/app/admin/users/UserManagementPage.tsx
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
import { MoreHorizontal } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react' // Added for a better loading spinner

// --- 1. TYPE DEFINITIONS ---

// Define the precise types returned from the CREATOR database table
type CreatorProfileDB = {
    id: string
    email: string
    full_name: string
    created_at: string
    phone: string | null
    country: string | null
    // PAYMENT FIELDS:
    payment_method: string | null
    payment_account_name: string | null
    payment_account_number: string | null
    payment_frequency: string | null
    payment_mobilemoney_number: string | null
    has_payment_details: boolean
}

// Define the precise types returned from the BRAND database table
type BrandProfileDB = {
    id: string
    brand_email: string
    brand_name: string
    created_at: string
    contact: string | null
}

// Define the UNIFIED UserProfile type used throughout the component
type UserProfile = {
    id: string
    email: string
    role: 'creator' | 'brand'
    name: string
    created_at: string
    is_active: boolean // Placeholder

    // Creator specific fields
    phone?: string | null
    country?: string | null
    payment_method?: string | null
    payment_account_name?: string | null
    payment_account_number?: string | null
    payment_frequency?: string | null
    payment_mobilemoney_number?: string | null
    has_payment_details?: boolean

    // Brand specific fields
    contact?: string | null
}

// --- 2. MAPPER FUNCTIONS ---

const mapCreatorToUserProfile = (creator: CreatorProfileDB): UserProfile => ({
    id: creator.id,
    email: creator.email,
    role: 'creator',
    name: creator.full_name,
    created_at: creator.created_at,
    is_active: true, // Placeholder until schema update
    phone: creator.phone,
    country: creator.country,
    payment_method: creator.payment_method,
    payment_account_name: creator.payment_account_name,
    payment_account_number: creator.payment_account_number,
    payment_frequency: creator.payment_frequency,
    payment_mobilemoney_number: creator.payment_mobilemoney_number,
    has_payment_details: creator.has_payment_details,
})

const mapBrandToUserProfile = (brand: BrandProfileDB): UserProfile => ({
    id: brand.id,
    email: brand.brand_email,
    role: 'brand',
    name: brand.brand_name,
    created_at: brand.created_at,
    is_active: true, // Placeholder until schema update
    contact: brand.contact,
})

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
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
            // Fields to fetch for Creators, including all payment details
            const creatorSelectFields =
                'id, email, full_name, created_at, phone, country, payment_method, payment_account_name, payment_account_number, payment_frequency, payment_mobilemoney_number, has_payment_details'

            // 1. Fetch creator profiles
            const { data: creators, error: creatorError } = await supabaseClient.from('creator_profiles').select(creatorSelectFields).returns<CreatorProfileDB[]>()

            // 2. Fetch brand profiles
            const { data: brands, error: brandError } = await supabaseClient
                .from('brand_profiles')
                .select('id, brand_email, brand_name, created_at, contact')
                .returns<BrandProfileDB[]>()

            if (creatorError || brandError) {
                console.error('Error fetching users:', creatorError || brandError)
                toast.error('Failed to load users. Please check the database connection.')
                return
            }

            // 3. Map and combine the data
            const creatorProfiles: UserProfile[] = (creators || []).map(mapCreatorToUserProfile)
            const brandProfiles: UserProfile[] = (brands || []).map(mapBrandToUserProfile)

            setUsers([...creatorProfiles, ...brandProfiles])
        } catch (e) {
            console.error('An unexpected error occurred:', e)
            toast.error('An unexpected error occurred while fetching user data.')
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filter === 'all' || user.role === filter
        return matchesSearch && matchesFilter
    })

    const handleViewProfile = (user: UserProfile) => {
        setSelectedUser(user)
        setViewProfileModal(true)
    }

    const handleToggleStatus = async (user: UserProfile) => {
        // ACTION: Implement Supabase update logic here when your schema is ready
        toast.info(`Toggling status for ${user.name}... (This feature requires a database schema update)`)
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

            {/* Search and Filter UI */}
            <div className="flex justify-between items-center">
                <Input placeholder="Search users by name or email..." className="max-w-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <Tabs value={filter} onValueChange={setFilter}>
                    <TabsList>
                        <TabsTrigger value="all">All Users</TabsTrigger>
                        <TabsTrigger value="creator">Creators</TabsTrigger>
                        <TabsTrigger value="brand">Brands</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* User Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
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
                                            className={`capitalize ${user.role === 'creator' ? 'bg-[#e85c51]/10 text-[#e85c51]' : 'bg-blue-500/10 text-blue-500'}`}
                                        >
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`${user.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {user.is_active ? 'Active' : 'Suspended'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewProfile(user)}>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>{user.is_active ? 'Suspend User' : 'Unsuspend User'}</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-neutral-500">
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
                            <DialogTitle className="capitalize">{selectedUser.name}</DialogTitle>
                            <DialogDescription>{selectedUser.role} Profile Details</DialogDescription>
                        </DialogHeader>

                        <Separator className="my-4" />
                        <div className="space-y-3 text-sm max-h-[70vh] overflow-y-auto pr-4">
                            {/* General Details */}
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

                            {/* Creator Specific Details */}
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
                                        <p className="text-red-500 italic">⚠️ Creator has not yet set up payment details.</p>
                                    )}
                                </>
                            )}

                            {/* Brand Specific Details */}
                            {selectedUser.role === 'brand' && (
                                <>
                                    <Separator className="!mt-4 !mb-4" />
                                    <h4 className="font-bold text-base text-gray-700">Brand Contact</h4>
                                    <p>
                                        <strong>Primary Contact:</strong> {selectedUser.contact || 'N/A'}
                                    </p>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
