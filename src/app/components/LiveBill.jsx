'use client';

import { createClient } from '@/app/lib/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { useCartStore } from '@/app/store/cartStore';
import DummyCheckout from './DummyCheckout';

export default function LiveBill({ tableId, tableInfo }) {
    const supabase = createClient();
    const { items, clearCart } = useCartStore();
    const [sessionItems, setSessionItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isPaying, setIsPaying] = useState(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const fetchBill = useCallback(async () => {
        if (!tableId) return;
        
        console.log(`[Polling] Fetching bill data...`);
        const { data, error } = await supabase.rpc('get_live_bill_items', {
            p_table_id: tableId
        });

        if (error) {
            console.error("Error fetching live bill:", error);
            setSessionItems([]);
        } else {
            setSessionItems(data || []);
        }

        // Always try to fetch sessionId if not set
        if (!sessionId) {
            const { data: sessionData } = await supabase
                .from('table_sessions')
                .select('id')
                .eq('table_id', tableId)
                .eq('status', 'open')
                .single();
            if(sessionData) {
                setSessionId(sessionData.id);
            }
        }
    }, [tableId, supabase, sessionId]);
    
    useEffect(() => {
        // Initial fetch when the component mounts.
        fetchBill();

        // Handler for local order submissions for an instant update.
        const handleOrderSubmitted = () => {
            console.log('Local event "orderSubmitted" received. Refetching bill instantly.');
            fetchBill();
        };
        window.addEventListener('orderSubmitted', handleOrderSubmitted);

        // --- START: POLLING LOGIC ---
        // This timer will refetch the bill every 7 seconds to get updates from others.
        const intervalId = setInterval(() => {
            fetchBill();
        }, 7000); // 7000 milliseconds = 7 seconds
        // --- END: POLLING LOGIC ---

        
        // Cleanup function to remove the timer and event listener when the component unmounts.
        // This is CRITICAL to prevent memory leaks.
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('orderSubmitted', handleOrderSubmitted);
        };
    }, [tableId, fetchBill]);

    // Fetch sessionId independently so it's always available
    useEffect(() => {
        if (!tableId || sessionId) return;
        const fetchSession = async () => {
            const { data: sessionData, error } = await supabase
                .from('table_sessions')
                .select('id')
                .eq('table_id', tableId)
                .eq('status', 'open')
                .single();
            if (error) {
                console.error("Error fetching sessionId:", error);
            } else if (sessionData) {
                setSessionId(sessionData.id);
            }
        };
        fetchSession();
    }, [tableId, sessionId, supabase]);

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev => 
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handlePaymentSuccess = () => {
        setIsPaying(false);
        setSelectedItems([]);
        // Do an immediate refetch after our own payment succeeds.
        fetchBill();
    };

    const handleSendOrder = async () => {
        setIsSubmittingOrder(true);

        if (!tableInfo?.id || !tableInfo?.venue_id) {
            alert("Critical Error: Missing Table ID or Venue ID.");
            setIsSubmittingOrder(false);
            return;
        }

        const formattedCartItems = items.map(item => ({ 
            menu_item_id: item.id, 
            quantity: item.quantity, 
            price_at_order: item.price 
        }));

        const { data, error } = await supabase.rpc('submit_new_order', { 
            p_table_id: tableInfo.id, 
            p_venue_id: tableInfo.venue_id, 
            p_cart_items: formattedCartItems 
        });

        if (error) {
            console.error("Error calling submit_new_order RPC:", error);
            alert(`Could not submit your order: ${error.message}`);
        } else {
            console.log("Successfully submitted order:", data);
            clearCart();
            window.dispatchEvent(new CustomEvent('orderSubmitted'));
        }
        
        setIsSubmittingOrder(false);
    };

    // Calculate totals
    const itemsToPayFor = sessionItems.filter(item => selectedItems.includes(item.id));
    const paymentTotal = itemsToPayFor.reduce((acc, item) => acc + (item.price_at_order * item.quantity), 0);
    const totalItems = sessionItems.filter(item => !item.payment_id).length;
    const totalAmount = sessionItems
        .filter(item => !item.payment_id)
        .reduce((acc, item) => acc + (item.price_at_order * item.quantity), 0);
    
    // Cart totals from store
    const pendingItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const pendingTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <>
            {/* Floating Cart Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative bg-gray-900 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.2 5M7 13l-1.2 5m1.2-5h10m0 0v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m0 0h10"/>
                    </svg>
                    {(totalItems + pendingItemsCount) > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                            {totalItems + pendingItemsCount}
                        </div>
                    )}
                </button>
            </div>

            {/* Sidebar/Modal */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Sidebar */}
                    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-gray-900 p-4 md:p-6 text-white flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-bold">Your Order</h3>
                                    <p className="text-gray-300 text-sm">
                                        {totalItems + pendingItemsCount} items • ${(totalAmount + pendingTotal).toFixed(2)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto">
                                {/* Pending Items from Cart (not yet ordered) */}
                                {items.length > 0 && (
                                    <div className="p-4 md:p-6 border-b border-gray-200 bg-blue-50">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-gray-900">Ready to Order</h4>
                                            <span className="text-sm font-medium text-gray-600">
                                                {pendingItemsCount} items • ${pendingTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            {items.map(item => (
                                                <div key={item.id} className="flex justify-between items-center py-2">
                                                    <span className="font-medium text-gray-900">
                                                        {item.quantity}x {item.name}
                                                    </span>
                                                    <span className="font-bold text-gray-900">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleSendOrder}
                                            disabled={isSubmittingOrder}
                                            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:bg-gray-400"
                                        >
                                            {isSubmittingOrder ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                                    </svg>
                                                    Sending Order...
                                                </span>
                                            ) : (
                                                'Send Order to Kitchen'
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Session Items (already ordered) */}
                                <div className="p-4 md:p-6">
                                    {sessionItems.length === 0 && items.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.2 5M7 13l-1.2 5m1.2-5h10m0 0v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m0 0h10"/>
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h4>
                                            <p className="text-gray-500">Start adding some delicious items!</p>
                                        </div>
                                    ) : sessionItems.length > 0 ? (
                                        <>
                                            <h4 className="font-bold text-gray-900 mb-4">Order History</h4>
                                            <div className="space-y-3">
                                                {sessionItems.map(item => (
                                                    <div 
                                                        key={item.id} 
                                                        className={`p-4 rounded-lg border transition-all duration-200 ${
                                                            item.payment_id 
                                                                ? 'bg-green-50 border-green-200 opacity-60' 
                                                                : selectedItems.includes(item.id)
                                                                    ? 'bg-gray-100 border-gray-400 shadow-sm'
                                                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                {!item.payment_id && (
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-500 focus:ring-2" 
                                                                        checked={selectedItems.includes(item.id)} 
                                                                        onChange={() => handleSelectItem(item.id)} 
                                                                    />
                                                                )}
                                                                <div className={item.payment_id ? 'ml-8' : ''}>
                                                                    <p className={`font-semibold ${item.payment_id ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                                                                        {item.quantity}x {item.menu_items.name}
                                                                    </p>
                                                                    {item.payment_id && (
                                                                        <p className="text-xs text-green-600 font-medium">✓ Paid</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className={`font-bold ${item.payment_id ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                                                                ${(item.price_at_order * item.quantity).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            {/* Payment Section */}
                            {itemsToPayFor.length > 0 && (
                                <div className="flex-shrink-0 border-t bg-gray-50 p-4 md:p-6 safe-area-inset-bottom">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base md:text-lg font-semibold text-gray-900">
                                                Selected Items ({itemsToPayFor.length})
                                            </span>
                                            <span className="text-xl md:text-2xl font-bold text-gray-900">
                                                ${paymentTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => setIsPaying(true)} 
                                            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-lg font-bold text-base md:text-lg shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation"
                                            disabled={!sessionId}
                                        >
                                            {sessionId ? 'Pay for Selected Items' : 'Loading session...'}
                                        </button>
                                        {!sessionId && (
                                            <p className="text-sm text-gray-500 text-center">
                                                Waiting for session to load...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Overlay */}
                        {isPaying && (
                            <div className="absolute inset-0 bg-white z-10">
                                <DummyCheckout
                                    totalAmount={paymentTotal}
                                    paidItemIds={selectedItems}
                                    sessionId={sessionId}
                                    onCancel={() => setIsPaying(false)}
                                    onSuccess={handlePaymentSuccess}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}