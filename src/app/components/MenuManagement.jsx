'use client';

import { createClient } from "@/app/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import AddItemForm from "./AddItemForm";

// A sub-component for managing categories (Add/Delete)
function CategoryManager({ venueId, categories, onUpdate }) {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        setIsLoading(true);
        const { error } = await supabase.from('categories').insert({ name: newCategoryName, venue_id: venueId });
        if (error) {
            alert(`Error adding category: ${error.message}`);
        } else {
            setNewCategoryName('');
            onUpdate(); // Tell the parent to refetch all data
        }
        setIsLoading(false);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm("Are you sure you want to delete this category? Any items in it will become 'Uncategorized'.")) {
            return;
        }
        const { error } = await supabase.from('categories').delete().eq('id', categoryId);
        if (error) {
            alert(`Error deleting category: ${error.message}`);
        } else {
            onUpdate(); // Refresh the parent's data
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 className="font-bold text-xl mb-4 text-gray-800">Manage Categories</h3>
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    value={newCategoryName} 
                    onChange={(e) => setNewCategoryName(e.target.value)} 
                    placeholder="New category name" 
                    required 
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoading ? '...' : 'Add'}
                </button>
            </form>
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-600">Existing Categories:</h4>
                <div className="flex flex-wrap gap-2">
                    {categories.length > 0 ? categories.map(cat => (
                        <span key={cat.id} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-full flex items-center gap-2">
                            {cat.name}
                            <button 
                                onClick={() => handleDeleteCategory(cat.id)} 
                                title={`Delete category: ${cat.name}`}
                                className="text-red-500 hover:text-red-700 font-bold leading-none"
                            >
                                ×
                            </button>
                        </span>
                    )) : <p className="text-xs text-gray-400 italic">No categories created yet.</p>}
                </div>
            </div>
        </div>
    );
}

// Main Menu Management Component
export default function MenuManagement({ venueId }) {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const fetchData = useCallback(async () => {
        if (!venueId) return;
        setIsLoading(true);

        const [itemsResponse, categoriesResponse] = await Promise.all([
            supabase.from('menu_items').select('*, categories(name)').eq('venue_id', venueId).order('created_at', { ascending: false }),
            supabase.from('categories').select('*').eq('venue_id', venueId).order('name')
        ]);
        
        if (itemsResponse.error) console.error("Error fetching menu items:", itemsResponse.error);
        else setMenuItems(itemsResponse.data || []);
        
        if (categoriesResponse.error) console.error("Error fetching categories:", categoriesResponse.error);
        else setCategories(categoriesResponse.data || []);
        
        setIsLoading(false);
    }, [supabase, venueId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleAvailability = async (itemId, currentStatus) => {
        const { error } = await supabase
            .from('menu_items')
            .update({ is_available: !currentStatus })
            .eq('id', itemId);

        if (error) {
            alert(`Error updating availability: ${error.message}`);
        } else {
            // Optimistically update the UI for a faster feel
            setMenuItems(currentItems =>
                currentItems.map(item =>
                    item.id === itemId ? { ...item, is_available: !currentStatus } : item
                )
            );
        }
    };

    const handleDeleteItem = async (itemId, imageUrl) => {
        if (!window.confirm("Are you sure you want to permanently delete this menu item? This action cannot be undone.")) {
            return;
        }

        // Optional: Delete the associated image from storage first
        if (imageUrl) {
            try {
                const path = new URL(imageUrl).pathname.split('/menu-images/')[1];
                if (path) {
                    await supabase.storage.from('menu-images').remove([path]);
                }
            } catch (e) {
                console.error("Could not parse image URL to delete from storage, but proceeding with DB deletion:", e);
            }
        }

        // Delete the item from the database
        const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
        if (error) {
            alert(`Error deleting item: ${error.message}`);
        } else {
            fetchData(); // Refresh the entire list from the database
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <CategoryManager 
                    venueId={venueId} 
                    categories={categories}
                    onUpdate={fetchData} 
                />
                <AddItemForm 
                    venueId={venueId} 
                    categories={categories}
                    onItemAdded={fetchData}
                />
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold text-xl mb-4 text-gray-800">Current Menu Items</h3>
                {isLoading ? <p>Loading menu...</p> : (
                    <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
                        {menuItems.length > 0 ? menuItems.map(item => (
                            <div key={item.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center transition-all hover:shadow-sm">
                                <div>
                                    <p className="font-bold text-gray-900">{item.name}</p>
                                    <p className="text-sm text-gray-500">{item.categories?.name || 'Uncategorized'} - ${parseFloat(item.price).toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Availability Toggle */}
                                    <label title={`Mark as ${item.is_available ? "Unavailable (86)" : "Available"}`} className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" id={`toggle-${item.id}`} className="sr-only" checked={item.is_available} onChange={() => handleToggleAvailability(item.id, item.is_available)} />
                                            <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
                                            <div className={`dot absolute left-1 top-1 w-6 h-6 rounded-full transition-all duration-300 ${item.is_available ? 'transform translate-x-6 bg-green-400' : 'bg-red-400'}`}></div>
                                        </div>
                                    </label>
                                    {/* Delete Button */}
                                    <button 
                                        onClick={() => handleDeleteItem(item.id, item.image_url)}
                                        title="Delete Item Permanently"
                                        className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>No menu items found.</p>
                                <p className="text-sm">Use the form on the left to add your first item!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}