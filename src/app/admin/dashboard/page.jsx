'use client';
import { createClient } from "@/app/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

// Import all necessary components
import CloseSessionsButton from "@/app/components/CloseSessionsButton";
import StatCard from "@/app/components/StatCard";
import InsightList from "@/app/components/InsightList";

export default function AdminDashboard() {
    const [venueId, setVenueId] = useState(null);
    const [stats, setStats] = useState(null);
    const supabase = createClient();

    // This function fetches all the high-level stats for the KPI cards and insight lists.
    const fetchDashboardStats = useCallback(async (currentVenueId) => {
        const idToFetch = venueId || currentVenueId;
        if (!idToFetch) return;
        
        console.log(`[${new Date().toLocaleTimeString()}] Fetching dashboard stats...`);
        const { data, error } = await supabase.rpc('get_venue_dashboard_stats', {
            p_venue_id: idToFetch
        });

        if (error) {
            console.error("Error fetching dashboard stats:", error);
            setStats(null);
        } else {
            setStats(data);
        }
    }, [supabase, venueId]);

    // This primary useEffect runs once to get the venueId and set up all data fetching.
    useEffect(() => {
        const initializeDashboard = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: venueData } = await supabase.from('venues').select('id').eq('owner_id', user.id).single();
            if (!venueData) return;

            const currentVenueId = venueData.id;
            setVenueId(currentVenueId);

            // 1. Initial Fetch of stats
            fetchDashboardStats(currentVenueId);

            // 2. Set up Broadcast Listener for instant updates
            const channel = supabase.channel('dashboard-updates');
            channel.on('broadcast', { event: 'dashboard-updates' }, (payload) => {
                if (payload.payload?.venue_id === currentVenueId) {
                    console.log('Broadcast received! Refetching stats immediately.');
                    fetchDashboardStats(currentVenueId);
                }
            }).subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Subscribed to dashboard-updates broadcast channel!');
                }
            });

            // 3. Set up Polling as a reliable fallback
            const pollInterval = setInterval(() => {
                console.log('Polling for stats updates...');
                fetchDashboardStats(currentVenueId);
            }, 10000); // Poll every 30 seconds

            // Return a cleanup function
            return () => {
                console.log('Cleaning up dashboard listeners.');
                supabase.removeChannel(channel);
                clearInterval(pollInterval);
            };
        };

        let cleanup;
        initializeDashboard().then(cleanupFn => {
            cleanup = cleanupFn;
        });

        // This is the actual cleanup function that React will call on unmount
        return () => {
            if (cleanup) cleanup();
        };
    }, [supabase, fetchDashboardStats]);

    // Calculate AOV safely
    const averageOrderValue = stats && stats.todays_orders > 0
        ? stats.todays_sales / stats.todays_orders
        : stats?.todays_sales || 0;

    return (
        <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-full">
            {/* Header Area */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, here's your venue's performance overview.</p>
                </div>
                <div className="w-auto flex-shrink-0">
                    <CloseSessionsButton venueId={venueId} />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
                <StatCard title="Today's Total Sales" value={stats?.todays_sales ?? 0} icon="💰" format="currency" />
                <StatCard title="Average Order Value" value={averageOrderValue} icon="🧾" format="currency" />
                <StatCard title="Open Tables" value={stats?.open_sessions ?? 0} icon="🍽️" />
                <StatCard title="Pending Kitchen Orders" value={stats?.open_kitchen_orders ?? 0} icon="🔥" />
            </div>

            {/* Insight Lists */}
            <div className="animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InsightList title="Top 5 Best-Selling Items (Last 7 Days)" data={stats?.top_selling} valueKey="total_sold" valueLabel="sold" />
                    <InsightList title="Top 5 Highest-Grossing Items (Last 7 Days)" data={stats?.top_grossing} valueKey="total_revenue" valueLabel="revenue" format="currency" />
                </div>
            </div>
        </div>
    );
}