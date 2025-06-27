'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";

// The form now accepts `itemToEdit` and a function to clear the editing state
export default function AddItemForm({ venueId, categories, onItemAdded, itemToEdit, setItemToEdit }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isPopular, setIsPopular] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const supabase = createClient();

    // This useEffect hook listens for changes to `itemToEdit`
    // When an item is passed in, it populates the form fields.
    useEffect(() => {
        if (itemToEdit) {
            setName(itemToEdit.name);
            setDescription(itemToEdit.description || '');
            setPrice(itemToEdit.price);
            setCategoryId(itemToEdit.category_id || '');
            setIsPopular(itemToEdit.is_popular || false);
            setCurrentImageUrl(itemToEdit.image_url);
        } else {
            // If itemToEdit is cleared, reset the form
            setName('');
            setDescription('');
            setPrice('');
            setCategoryId('');
            setIsPopular(false);
            setCurrentImageUrl(null);
        }
    }, [itemToEdit]);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const clearForm = () => {
        // We now call the parent's function to clear the editing state
        setItemToEdit(null);
        setImageFile(null);
        setError('');
        // The useEffect will handle resetting the other form fields
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price || !categoryId) {
            setError("Name, price, and category are required.");
            return;
        }
        
        setIsLoading(true);
        setError('');

        let imageUrl = itemToEdit ? itemToEdit.image_url : null;

        if (imageFile) {
            // If a new image is selected, upload it
            const fileName = `${Date.now()}_${imageFile.name}`;
            const filePath = `${venueId}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('menu-images').upload(filePath, imageFile);

            if (uploadError) {
                setError(`Failed to upload image: ${uploadError.message}`);
                setIsLoading(false);
                return;
            }
            
            // Get the new public URL
            imageUrl = supabase.storage.from('menu-images').getPublicUrl(filePath).data.publicUrl;
        }
        
        const itemData = {
            name,
            description,
            price: parseFloat(price),
            category_id: categoryId,
            venue_id: venueId,
            is_popular: isPopular,
            image_url: imageUrl
        };

        if (itemToEdit) {
            // --- EDIT MODE: Perform an UPDATE ---
            const { error: updateError } = await supabase
                .from('menu_items')
                .update(itemData)
                .eq('id', itemToEdit.id);

            if (updateError) setError(`Failed to update item: ${updateError.message}`);
            else {
                clearForm();
                onItemAdded(); // Notify parent to refetch
            }
        } else {
            // --- ADD MODE: Perform an INSERT ---
            const { error: insertError } = await supabase
                .from('menu_items')
                .insert(itemData);

            if (insertError) setError(`Failed to add item: ${insertError.message}`);
            else {
                clearForm();
                onItemAdded();
            }
        }
        
        setIsLoading(false);
    };

    // Determine if we are in "edit mode"
    const isEditing = !!itemToEdit;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-xl mb-4 text-gray-800">{isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* All form fields remain the same */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                        <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
                            <option value="" disabled>Select a category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700">Menu Image</label>
                    <input 
                        type="file" 
                        id="image"
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleImageChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {currentImageUrl && <p className="text-xs text-gray-500 mt-1">Current image is set. Choose a new file to replace it.</p>}
                </div>
                
                <div className="flex items-center">
                    <input id="is_popular" type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                    <label htmlFor="is_popular" className="ml-2 block text-sm text-gray-900">Mark as "Popular"</label>
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <div className="flex gap-2">
                    {isEditing && (
                        <button type="button" onClick={clearForm} className="w-1/3 p-3 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600">
                            Cancel
                        </button>
                    )}
                    <button type="submit" disabled={isLoading} className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
                        {isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Item')}
                    </button>
                </div>
            </form>
        </div>
    );
}