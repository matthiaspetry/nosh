'use client';
import { createClient } from "@/app/lib/supabase/client";
import { useEffect, useState } from "react";
import TableManagement from "@/app/components/TableManagement"; // We will create this next

export default function TablesPage() {
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
        <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-full">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Table Management</h1>
                    <p className="text-gray-500">Manage tables and generate QR codes for your venue.</p>
                </div>
            </div>
            <TableManagement venueId={venueId} />
        </div>
    );
}