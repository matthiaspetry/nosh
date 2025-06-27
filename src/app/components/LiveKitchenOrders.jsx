'use client';

import { createClient } from "@/app/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

export default function LiveKitchenOrders({ venueId }) {
    const [orders, setOrders] = useState([]);
    const [loadingOrderAction, setLoadingOrderAction] = useState(null);
    const supabase = createClient();

    const fetchOrders = useCallback(async () => {
        if (!venueId) return;
        const { data } = await supabase
            .from('orders')
            .select('id, created_at, status, tables(table_number)')
            .eq('venue_id', venueId)
            .in('status', ['pending', 'confirmed'])
            .order('created_at', { ascending: false });
        setOrders(data || []);
    }, [supabase, venueId]);

    useEffect(() => {
        fetchOrders();
        // Setup polling since Realtime isn't on for the free plan
        const pollInterval = setInterval(fetchOrders, 10000);
        return () => clearInterval(pollInterval);
    }, [fetchOrders]);

    const handleCompleteOrder = async (orderId) => {
        setLoadingOrderAction(orderId);
        const { data, error } = await supabase.rpc('complete_order', { p_order_id: orderId, p_venue_id: venueId });
        if (error) {
            alert(`Failed to complete order: ${error.message}`);
        } else if (data > 0) {
            fetchOrders(); // Refetch to update the list
        }
        setLoadingOrderAction(null);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-4 text-gray-700">Pending & Confirmed Orders</h3>
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No pending orders at the moment.</p>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                            <div>
                                <p className="font-bold">Table: {order.tables?.table_number || 'N/A'}</p>
                                <p>Status: <span className="font-semibold">{order.status}</span></p>
                                <p className="text-sm text-gray-500">Time: {new Date(order.created_at).toLocaleTimeString()}</p>
                            </div>
                            <button
                                onClick={() => handleCompleteOrder(order.id)}
                                disabled={loadingOrderAction === order.id}
                                className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
                            >
                                {loadingOrderAction === order.id ? '...' : 'Mark Complete'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}