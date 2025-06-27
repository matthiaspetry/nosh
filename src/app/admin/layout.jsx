import { createClient } from '@/app/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminLogout from '@/app/components/AdminLogout';

export default async function AdminLayout({ children }) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }
    
    return (
        <div className="flex h-screen bg-gray-100">
            <nav className="w-64 bg-gray-800 text-white p-4 flex flex-col">
                <h2 className="text-xl font-bold mb-6">Admin Portal</h2>
                <div className="space-y-2 flex-grow">
                    <a href="/admin/dashboard" className="block py-2.5 px-4 rounded hover:bg-gray-700">Dashboard</a>
                    <a href="/admin/menu" className="block py-2.5 px-4 rounded hover:bg-gray-700">Menu Management</a>
                    <a href="/admin/kitchen" className="block py-2.5 px-4 rounded hover:bg-gray-700">Live Kitchen Orders</a>
                    {/* --- NEW LINK ADDED HERE --- */}
                    <a href="/admin/tables" className="block py-2.5 px-4 rounded hover:bg-gray-700">Table Management</a>
                </div>
                <div className="mt-auto">
                     <AdminLogout />
                </div>
            </nav>
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}