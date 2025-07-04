'use client';

import Image from 'next/image';
import { useCartStore } from '@/app/store/cartStore'; // Import the cart store

export default function MenuItemCard({ item }) {
    // --- START: NEW LOGIC ---
    // Get cart actions and the specific item from the cart
    const { items, addItem, incrementQuantity, decrementQuantity } = useCartStore();
    const itemInCart = items.find(cartItem => cartItem.id === item.id);
    const quantityInCart = itemInCart ? itemInCart.quantity : 0;
    // --- END: NEW LOGIC ---

    const hasImage = !!item.image_url;

    return (
        <div className="group relative bg-gradient-to-br from-white to-gray-50/30 rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1">
            {item.is_popular && (
                <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-md">
                        🔥 Popular
                    </span>
                </div>
            )}

            <div className="flex flex-col md:flex-row">
                {hasImage ? (
                    <div className="relative w-full h-48 md:h-auto md:w-48 flex-shrink-0 overflow-hidden">
                        <Image src={item.image_url} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 192px" className="transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    </div>
                ) : (
                    <div className="w-full h-48 md:h-auto md:w-48 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-gray-400 text-center">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-sm font-medium">No Image</span>
                        </div>
                    </div>
                )}
                
                <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{item.name}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                        </div>
                        {item.allergens_tags && item.allergens_tags.length > 0 && (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                <span className="text-xs text-gray-500 font-medium">Contains: {item.allergens_tags.join(', ')}</span>
                            </div>
                        )}
                    </div>

                    {/* Price and Button Section */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-gray-900">${item.price.toFixed(2)}</span>
                        </div>
                        
                        {/* --- START: CONDITIONAL BUTTON/STEPPER LOGIC --- */}
                        {quantityInCart === 0 ? (
                            // If quantity is 0, show the "Add to Cart" button
                            <button
                                onClick={() => addItem(item)}
                                className="bg-black text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-md hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 active:scale-95"
                            >
                                <span className="flex items-center gap-2">Add to Tab</span>
                            </button>
                        ) : (
                            // If quantity is > 0, show the stepper
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => decrementQuantity(item.id)}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full font-bold text-xl hover:bg-gray-300 transition active:scale-90"
                                >
                                    -
                                </button>
                                <span className="text-xl font-bold w-10 text-center">{quantityInCart}</span>
                                <button 
                                    onClick={() => incrementQuantity(item.id)}
                                    className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full font-bold text-xl hover:bg-gray-800 transition active:scale-90"
                                >
                                    +
                                </button>
                            </div>
                        )}
                        {/* --- END: CONDITIONAL BUTTON/STEPPER LOGIC --- */}
                    </div>
                </div>
            </div>
        </div>
    );
}