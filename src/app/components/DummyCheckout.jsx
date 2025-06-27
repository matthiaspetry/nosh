'use client';

import { createClient } from '@/app/lib/supabase/client';
import { useState } from 'react';

// A simple, universally compatible function to generate a random UUID-like string.
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Add `onSuccess` to the props being destructured.
export default function DummyCheckout({ sessionId, paidItemIds, totalAmount, onCancel, onSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleConfirmPayment = async () => {
        setIsLoading(true);
        const supabase = createClient();
        const dummyPaymentIntentId = `dummy_${generateUUID()}`;

        const { error: rpcError } = await supabase.rpc('finalize_payment', {
            p_payment_intent_id: dummyPaymentIntentId,
            p_table_session_id: sessionId,
            p_amount: totalAmount,
            p_tip_amount: 0,
            p_paid_item_ids: paidItemIds,
        });

        if (rpcError) {
            setMessage('An error occurred while saving the payment. Please try again.');
            console.error('RPC Error:', rpcError);
            setIsLoading(false);
        } else {
            setMessage('Payment Successful! The bill will now update.');
            // --- THIS IS THE FIX ---
            // After showing the success message, wait a moment and then
            // call the onSuccess function passed from the parent component.
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess(); 
                }
            }, 1500); // 1.5 second delay for the user to see the message.
            // --- END FIX ---
        }
    };

    return (
        <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
            <h3 className="text-xl font-bold text-center mb-4">Confirm Payment</h3>
            <div className="text-center my-6">
                <p className="text-lg">You are paying for {paidItemIds.length} item(s).</p>
                <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
            </div>
            
            {message ? (
                <p className="text-center font-semibold text-green-700">{message}</p>
            ) : (
                <div className="space-y-2">
                    <button
                        onClick={handleConfirmPayment}
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white p-3 rounded-md font-bold hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {isLoading ? 'Processing...' : 'Confirm Dummy Payment'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="w-full bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}