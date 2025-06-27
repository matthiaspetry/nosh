'use client';

import { useCartStore } from '@/app/store/cartStore';
import { useState, useMemo, useRef, useEffect } from 'react';
import MenuItemCard from './MenuItemCard';
import CategoryTabs from './CategoryTabs';

export default function OrderForm({ menu }) {
    const { addItem } = useCartStore();
    const [activeCategory, setActiveCategory] = useState('');
    
    const categorySectionRefs = useRef({});
    const observer = useRef(null);
    const isClickScrolling = useRef(false); // Ref to track if scrolling is due to a tab click

    // Group menu items by category and sort them
    const categorizedMenu = useMemo(() => {
        const grouped = menu.reduce((acc, item) => {
            const categoryName = item.categories?.name || 'Uncategorized';
            const categoryIcon = item.categories?.icon_name;
            const sortOrder = item.categories?.sort_order ?? 9999;

            if (!acc[categoryName]) {
                acc[categoryName] = { name: categoryName, sort_order: sortOrder, icon_name: categoryIcon, items: [] };
            }
            acc[categoryName].items.push(item);
            return acc;
        }, {});

        const sortedCategories = Object.values(grouped).sort((a, b) => a.sort_order - b.sort_order);

        if (!activeCategory && sortedCategories.length > 0) {
            setActiveCategory(sortedCategories[0].name);
        }
        return sortedCategories;
    }, [menu, activeCategory]);


    // Setup IntersectionObserver to watch which category is in view
    useEffect(() => {
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(
            (entries) => {
                if (isClickScrolling.current) return; // Don't update tab if scroll is from a click

                const visibleEntry = entries.find(entry => entry.isIntersecting);
                if (visibleEntry) {
                    setActiveCategory(visibleEntry.target.dataset.categoryName);
                }
            },
            { rootMargin: '-80px 0px -60% 0px' } // Adjusted for sticky tab height
        );

        const sections = categorySectionRefs.current;
        Object.values(sections).forEach(section => {
            if (section) observer.current.observe(section);
        });

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [categorizedMenu]); // Re-run when the menu is processed


    // Function to handle tab clicks, which triggers a scroll
    const handleCategoryClick = (categoryName) => {
        isClickScrolling.current = true; // Set flag to true
        setActiveCategory(categoryName);
        
        const section = categorySectionRefs.current[categoryName];
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // After a short delay, reset the flag so IntersectionObserver can take over again
        setTimeout(() => {
            isClickScrolling.current = false;
        }, 800); // 800ms should be enough for smooth scroll to finish
    };


    const handleSendOrder = async () => {
        setIsLoading(true);
        const supabase = createClient();

        if (!tableInfo?.id || !tableInfo?.venue_id) {
            alert("Critical Error: Missing Table ID or Venue ID.");
            setIsLoading(false);
            return;
        }

        const formattedCartItems = items.map(item => ({ menu_item_id: item.id, quantity: item.quantity, price_at_order: item.price }));

        const { data, error } = await supabase.rpc('submit_new_order', { p_table_id: tableInfo.id, p_venue_id: tableInfo.venue_id, p_cart_items: formattedCartItems });

        if (error) {
            console.error("Error calling submit_new_order RPC:", error);
            alert(`Could not submit your order: ${error.message}`);
        } else {
            console.log("Successfully submitted order:", data);
            clearCart();
            window.dispatchEvent(new CustomEvent('orderSubmitted'));
        }
        
        setIsLoading(false);
    };

    return (
        <>
            {/* Sticky Category Tabs - positioned outside the main container for better sticking */}
            <CategoryTabs
                categories={categorizedMenu}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryClick}
            />
            
            {/* Main content container */}
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
                        <div className="p-6 md:p-8 space-y-12">
                            {categorizedMenu.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <div className="w-24 h-24 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-500 mb-2">No items available</h3>
                                    <p className="text-gray-400">Check back later for delicious options!</p>
                                </div>
                            ) : (
                                categorizedMenu.map(category => (
                                    <section 
                                        key={category.name} 
                                        ref={(el) => (categorySectionRefs.current[category.name] = el)}
                                        data-category-name={category.name}
                                        className="scroll-mt-24" // Adjusted to account for sticky tab height
                                    >
                                        <div className="mb-8">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                                {category.name}
                                            </h2>
                                            <div className="h-px bg-gray-200 w-20"></div>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {category.items.length > 0 ? (
                                                category.items.map(item => (
                                                    <MenuItemCard 
                                                        key={item.id} 
                                                        item={item} 
                                                        
                                                    />
                                                ))
                                            ) : (
                                                <div className="col-span-full text-center py-12">
                                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                                        </svg>
                                                    </div>
                                                    <p className="text-gray-500 font-medium">No items in this category yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}