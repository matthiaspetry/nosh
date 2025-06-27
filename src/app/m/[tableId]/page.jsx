import { createClient } from '@/app/lib/supabase/server';
import { notFound } from 'next/navigation';
import LiveBill from '@/app/components/LiveBill';
import OrderForm from '@/app/components/OrderForm';

export default async function TablePage({ params }) {
  const { tableId } = await params;
  const supabase = await createClient();

  // Step 1: Fetch table and venue data
  const { data: tableData, error: tableError } = await supabase
    .from('tables')
    .select('id, table_number, venue_id, venues(name)')
    .eq('id', tableId)
    .single();

  if (tableError || !tableData) {
    notFound();
  }

  // Step 2: Find or create the current "open" session for this table
  let { data: sessionData } = await supabase
    .from('table_sessions')
    .select('id, status')
    .eq('table_id', tableId)
    .eq('status', 'open')
    .single();

  if (!sessionData) {
    // Create a new open session if none exists
    const { data: newSession, error: sessionError } = await supabase
      .from('table_sessions')
      .insert({ table_id: tableId, venue_id: tableData.venue_id, status: 'open' })
      .select('id, status')
      .single();
    sessionData = newSession;
  }

  // Step 3: Fetch all menu items for the venue
  const { data: menuData } = await supabase
    .from('menu_items')
    .select('id, name, description, price, categories(name), image_url')
    .eq('venue_id', tableData.venue_id)
    .eq('is_available', true)
    .order('sort_order', { referencedTable: 'categories' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with clean styling */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {tableData.venues ? tableData.venues.name : 'Venue'}
            </h1>
            <p className="text-lg text-gray-600">
              {tableData.table_number}
            </p>
          </div>
        </div>
      </header>

      {/* Main content area with sticky tabs */}
      <main className="flex flex-col">
        <div className="flex-1">
          <OrderForm 
            menu={menuData || []} 
            tableInfo={tableData} 
            initialSession={sessionData} 
          />
        </div>
      </main>

      {/* Live Bill will be rendered as a modal/sidebar by the OrderForm */}
      <LiveBill initialSession={sessionData} tableId={tableId} tableInfo={tableData} />
    </div>
  );
}