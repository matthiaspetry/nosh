import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const existingItem = get().items.find((i) => i.id === item.id);
                if (existingItem) {
                    // If item exists, just increment its quantity
                    get().incrementQuantity(item.id);
                } else {
                    // Otherwise, add it with quantity 1
                    set((state) => ({ items: [...state.items, { ...item, quantity: 1 }] }));
                }
            },
            // --- NEW ACTIONS ---
            incrementQuantity: (itemId) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === itemId
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                }));
            },
            decrementQuantity: (itemId) => {
                set((state) => ({
                    items: state.items
                        .map((item) =>
                            item.id === itemId
                                ? { ...item, quantity: item.quantity - 1 }
                                : item
                        )
                        // Filter out any items whose quantity has dropped to 0 or less
                        .filter((item) => item.quantity > 0),
                }));
            },
            // --- END NEW ACTIONS ---
            removeItem: (itemId) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== itemId),
                }));
            },
            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'demo-cart-storage-js',
        }
    )
);