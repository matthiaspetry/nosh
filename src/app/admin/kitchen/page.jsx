'use client';
import { createClient } from "@/app/lib/supabase/client";
import { useEffect, useState } from "react";
import LiveKitchenOrders from "@/app/components/LiveKitchenOrders";

export default function KitchenPage() {
    const [venueId, setVenueId] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        const getVenueId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: venueData } = await supabase.from('venues').select('id').eq('owner_id', user.id).single();
                if (venueData) {
                    setVenueId(venueData.id);
                }
            }
        };
        getVenueId();
    }, [supabase]);

    return (
        <div>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Live Kitchen Orders</h1>
                    <p className="text-gray-500">Monitor incoming orders in real-time.</p>
                </div>
            </div>
            <LiveKitchenOrders venueId={venueId} />
        </div>
    );
}
