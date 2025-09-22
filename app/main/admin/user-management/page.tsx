'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// Define the UserProfile type to include all relevant fields for both creator and brand
type UserProfile = {
    id: string;
    email: string;
    role: 'creator' | 'brand';
    name: string;
    created_at: string;
    is_active: boolean; // Placeholder for future schema update
    // Union fields for the modal
    phone?: string;
    country?: string;
    contact?: string;
};

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewProfileModal, setViewProfileModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []); // Empty dependency array means this effect runs once on mount

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch creator profiles with all necessary fields
            const { data: creators, error: creatorError } = await supabaseClient
                .from('creator_profiles')
                .select('id, email, full_name, created_at, phone, country');
            
            // Fetch brand profiles with all necessary fields
            const { data: brands, error: brandError } = await supabaseClient
                .from('brand_profiles')
                .select('id, brand_email, brand_name, created_at, contact');
            
            if (creatorError || brandError) {
                console.error("Error fetching users:", creatorError || brandError);
                toast.error("Failed to load users. Please check the database connection.");
                return;
            }

            const creatorProfiles = creators?.map(c => ({
                id: c.id,
                email: c.email,
                role: 'creator',
                name: c.full_name,
                created_at: c.created_at,
                is_active: true, // Placeholder until schema update
                phone: c.phone,
                country: c.country,
            })) || [];

            const brandProfiles = brands?.map(b => ({
                id: b.id,
                email: b.brand_email,
                role: 'brand',
                name: b.brand_name,
                created_at: b.created_at,
                is_active: true, // Placeholder until schema update
                contact: b.contact,
            })) || [];

            //@ts-ignore

            setUsers([...creatorProfiles, ...brandProfiles]);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || user.role === filter;
        return matchesSearch && matchesFilter;
    });

    const handleViewProfile = (user: UserProfile) => {
        setSelectedUser(user);
        setViewProfileModal(true);
    };

    const handleToggleStatus = async (user: UserProfile) => {
        // This is a placeholder for future functionality.
        // Once your tables have an `is_active` or `status` field, this function will perform a Supabase update.
        toast.info(`Toggling status for ${user.name}... (This feature requires a database schema update)`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
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
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize ${user.role === 'creator' ? 'bg-[#e85c51]/10 text-[#e85c51]' : 'bg-blue-500/10 text-blue-500'}`}>
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
                                                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                                    {user.is_active ? 'Suspend User' : 'Unsuspend User'}
                                                </DropdownMenuItem>
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
            {selectedUser && (
                <Dialog open={viewProfileModal} onOpenChange={setViewProfileModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="capitalize">{selectedUser.name}</DialogTitle>
                            <DialogDescription>{selectedUser.role} Profile</DialogDescription>
                        </DialogHeader>
                        <Separator className="my-4" />
                        <div className="space-y-2 text-sm">
                            <p><strong>Email:</strong> {selectedUser.email}</p>
                            <p><strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                            {/* Display specific details based on role */}
                            {selectedUser.role === 'creator' && (
                                <>
                                    <p><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                                    <p><strong>Country:</strong> {selectedUser.country || 'N/A'}</p>
                                </>
                            )}
                            {selectedUser.role === 'brand' && (
                                <p><strong>Contact:</strong> {selectedUser.contact || 'N/A'}</p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}