'use client';

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

// The component receives the venueId as a prop from the page.
export default function CloseSessionsButton({ venueId }) {
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleCloseSessions = async () => {
        // Ask for confirmation before performing a destructive action.
        if (!window.confirm("Are you sure you want to close all open table sessions? This cannot be undone.")) {
            return;
        }

        setIsLoading(true);

        const { data, error } = await supabase.rpc('close_all_venue_sessions', {
            p_venue_id: venueId
        });

        if (error) {
            console.error("Error closing sessions:", error);
        } else {
            console.log("Sessions closed:", data);
        }
        
        setIsLoading(false);

        // Optional: Hide the message after a few seconds
    };

    if (!venueId) {
        // Don't render the button if we don't have a venueId yet.
        return null;
    }

    return (
        <div className="mt-8">
            <button
                onClick={handleCloseSessions}
                disabled={isLoading}
                className="w-full p-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-400"
            >
                {isLoading ? 'Closing...' : 'Close All Open Sessions'}
            </button>
        </div>
    );
}