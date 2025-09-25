'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Megaphone, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// A reusable Card component for metrics
const MetricCard = ({ title, value, icon, description }: { title: string; value: number; icon: React.ReactNode; description: string }) => (
    <Card className="flex-1 min-w-[250px] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
    </Card>
);

// Define a more complete type for recent activities
type RecentActivity = {
    message: string;
    timestamp: string;
    // Add other fields you might need, like a link to the source
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ newUsers: 0, pendingCampaigns: 0, pendingSubmissions: 0 });
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch count of new users (Creators + Brands) from the last 24 hours
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                
                const { count: newCreators } = await supabaseClient
                    .from('creator_profiles')
                    .select('*', { count: 'exact', head: true })
                    // .gt('created_at', yesterday);
                
                const { count: newBrands } = await supabaseClient
                    .from('brand_profiles')
                    .select('*', { count: 'exact', head: true })
                    // .gt('created_at', yesterday);
                
                // Fetch count of campaigns pending review
                const { count: pendingCampaigns } = await supabaseClient
                    .from('campaigns')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'inreview');
                
                // Fetch count of submissions approved by brands but not yet posted
                const { count: pendingSubmissions } = await supabaseClient
                    .from('campaign_submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'approved');

                setStats({
                    newUsers: (newCreators || 0) + (newBrands || 0),
                    pendingCampaigns: pendingCampaigns || 0,
                    pendingSubmissions: pendingSubmissions || 0,
                });

                // Fetch recent notifications for the activity feed
                const { data: notifications } = await supabaseClient
                    .from('admin_notifications')
                    .select('message, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                const activities = notifications?.map(n => ({
                    message: n.message,
                    timestamp: new Date(n.created_at).toLocaleString()
                })) || [];
                setRecentActivities(activities);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                toast.error("Failed to load dashboard data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []); // Empty dependency array means this effect runs once on mount

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Goheza - Admin Dashboard</h1>
            <div className="flex flex-wrap gap-4">
                <MetricCard 
                    title="New Sign-ups" 
                    value={stats.newUsers} 
                    icon={<User className="text-neutral-500" />} 
                    description="Users joined in the last 24h"
                />
                <MetricCard 
                    title="Campaigns to Review" 
                    value={stats.pendingCampaigns} 
                    icon={<Megaphone className="text-neutral-500" />} 
                    description="Awaiting your approval"
                />
                <MetricCard 
                    title="Submissions for Post" 
                    value={stats.pendingSubmissions} 
                    icon={<CheckCircle2 className="text-neutral-500" />} 
                    description="Approved and ready to post"
                />
            </div>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity, index) => (
                                <li key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                                    <p className="text-sm text-neutral-800">{activity.message}</p>
                                    <span className="text-xs text-neutral-500">{activity.timestamp}</span>
                                </li>
                            ))
                        ) : (
                            <p className="text-sm text-center text-neutral-500">No recent activity.</p>
                        )}
                    </ul>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/main/admin/campaign-management">
                    <Button className="w-full h-auto py-4 bg-[#e85c51] hover:bg-[#f3867e] text-white">
                        Review Campaigns
                    </Button>
                </Link>
                <Link href="/main/admin/user-management">
                    <Button className="w-full h-auto py-4 bg-gray-100 text-neutral-800 border hover:bg-gray-200">
                        Manage Users
                    </Button>
                </Link>
                <Link href="/main/admin/notifications">
                    <Button className="w-full h-auto py-4 bg-gray-100 text-neutral-800 border hover:bg-gray-200">
                        View Notifications
                    </Button>
                </Link>
            </div>
        </div>
    );
}