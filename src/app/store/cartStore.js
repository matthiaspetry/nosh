import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const existingItem = get().items.find((i) => i.id === item.id);
                if (existingItem) {
                    set((state) => ({
                        items: state.items.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                        ),
                    }));
                } else {
                    set((state) => ({ items: [...state.items, { ...item, quantity: 1 }] }));
                }
            },
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