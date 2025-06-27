'use client';

import { createClient } from "@/app/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import QRCode from "react-qr-code";

export default function TableManagement({ venueId }) {
    const [tables, setTables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newTableName, setNewTableName] = useState('');
    const [qrUrlForPrint, setQrUrlForPrint] = useState('');
    const [showQRModal, setShowQRModal] = useState(false);
    const supabase = createClient();

    const fetchTables = useCallback(async () => {
        if (!venueId) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('tables')
            .select('*')
            .eq('venue_id', venueId)
            .order('table_number');

        if (error) console.error("Error fetching tables:", error);
        else setTables(data || []);
        setIsLoading(false);
    }, [supabase, venueId]);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    const handleAddTable = async (e) => {
        e.preventDefault();
        if (!newTableName.trim()) return;

        const { error } = await supabase
            .from('tables')
            .insert({ table_number: newTableName, venue_id: venueId });

        if (error) {
            alert(`Error adding table: ${error.message}`);
        } else {
            setNewTableName('');
            fetchTables(); // Refresh the list
        }
    };

    const handlePrintQR = (tableId) => {
        const url = `${window.location.origin}/m/${tableId}`;
        setQrUrlForPrint(url);
        setShowQRModal(true);
    };

    const handleModalPrint = () => {
        window.print();
    };

    const handleCloseModal = () => {
        setShowQRModal(false);
        setQrUrlForPrint('');
    };

    return (
        <>
            {showQRModal && qrUrlForPrint && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.2)', textAlign: 'center', minWidth: 320 }}>
                        <h2 style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 16 }}>QR Code</h2>
                        <div style={{ margin: '0 auto', background: 'white', padding: 16, display: 'inline-block' }}>
                            <QRCode value={qrUrlForPrint} size={256} level="H" />
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
                            <button onClick={handleModalPrint} style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>Print</button>
                            <button onClick={handleCloseModal} style={{ padding: '8px 20px', background: '#e5e7eb', color: '#111827', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-bold text-xl mb-4">Add New Table</h3>
                        <form onSubmit={handleAddTable} className="space-y-4">
                            <div>
                                <label htmlFor="table_name" className="block text-sm font-medium text-gray-700">Table Name/Number</label>
                                <input type="text" id="table_name" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder='e.g., "Table 15" or "Bar Seat 3"' required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                            </div>
                            <button type="submit" className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Add Table</button>
                        </form>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-xl mb-4">Current Tables</h3>
                    {isLoading ? <p>Loading tables...</p> : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {tables.map(table => (
                                <div key={table.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                                    <p className="font-semibold text-gray-800">{table.table_number}</p>
                                    <button onClick={() => handlePrintQR(table.id)} className="p-2 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700">Print QR</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}