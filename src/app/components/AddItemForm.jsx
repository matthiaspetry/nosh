'use client';

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";

export default function AddItemForm({ venueId, categories, onItemAdded }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isPopular, setIsPopular] = useState(false);
    const [imageFile, setImageFile] = useState(null); // State for the selected image file

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const supabase = createClient();

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price || !categoryId) {
            setError("Name, price, and category are required.");
            return;
        }
        
        setIsLoading(true);
        setError('');

        let imageUrl = null;

        // --- START: IMAGE UPLOAD LOGIC ---
        if (imageFile) {
            // Create a unique file path for the image
            const fileName = `${Date.now()}_${imageFile.name}`;
            const filePath = `${venueId}/${fileName}`; // IMPORTANT: The folder is the venueId

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error("Error uploading image:", uploadError);
                setError(`Failed to upload image: ${uploadError.message}`);
                setIsLoading(false);
                return;
            }

            // If upload is successful, get the public URL
            const { data: urlData } = supabase.storage
                .from('menu-images')
                .getPublicUrl(filePath);

            imageUrl = urlData.publicUrl;
        }
        // --- END: IMAGE UPLOAD LOGIC ---


        // Now, insert the menu item with the image URL
        const { error: insertError } = await supabase
            .from('menu_items')
            .insert({
                name,
                description,
                price: parseFloat(price),
                category_id: categoryId,
                venue_id: venueId,
                is_popular: isPopular,
                image_url: imageUrl // Add the URL to the insert data
            });

        if (insertError) {
            console.error("Error inserting menu item:", insertError);
            setError(`Failed to add item: ${insertError.message}`);
        } else {
            // Success! Clear the form and notify the parent.
            setName('');
            setDescription('');
            setPrice('');
            setCategoryId('');
            setIsPopular(false);
            setImageFile(null);
            document.getElementById('image').value = ''; // Clear the file input
            onItemAdded();
        }
        
        setIsLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-xl mb-4 text-gray-800">Add New Menu Item</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.T.value)} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
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

                {/* --- NEW FILE INPUT FIELD --- */}
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700">Menu Image</label>
                    <input 
                        type="file" 
                        id="image"
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleImageChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>
                
                <div className="flex items-center">
                    <input id="is_popular" type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                    <label htmlFor="is_popular" className="ml-2 block text-sm text-gray-900">Mark as "Popular"</label>
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button type="submit" disabled={isLoading} className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
                    {isLoading ? 'Uploading...' : 'Add Item to Menu'}
                </button>
            </form>
        </div>
    );
}