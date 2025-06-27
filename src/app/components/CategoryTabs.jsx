'use client';

import { useRef, useEffect } from 'react';

// Helper to map icon names from the database to emojis
const CategoryIcon = ({ iconName }) => {
    switch (iconName?.toLowerCase()) {
        case 'appetizers': return <span className="mr-2">🥗</span>;
        case 'mains': return <span className="mr-2">🍽️</span>;
        case 'desserts': return <span className="mr-2">🍰</span>;
        case 'beverages': return <span className="mr-2">🥤</span>;
        default: return null;
    }
};

export default function CategoryTabs({ categories, activeCategory, onCategoryChange }) {
    const tabContainerRef = useRef(null);
    const tabRefs = useRef({});

    // Effect to scroll the active tab into view
    useEffect(() => {
        if (activeCategory && tabRefs.current[activeCategory]) {
            tabRefs.current[activeCategory].scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest'
            });
        }
    }, [activeCategory]);

    return (
        <div className="sticky top-0 bg-white z-20 shadow-sm border-b border-gray-200">
            <div ref={tabContainerRef} className="flex overflow-x-auto whitespace-nowrap scrollbar-hide p-4 space-x-2">
                {categories.map((category) => (
                    <button
                        key={category.name}
                        ref={(el) => (tabRefs.current[category.name] = el)}
                        onClick={() => onCategoryChange(category.name)}
                        className={`
                            px-6 py-3 rounded-lg text-sm font-semibold flex items-center justify-center transition-all duration-200 ease-in-out flex-shrink-0
                            ${activeCategory === category.name
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                        `}
                    >
                        <CategoryIcon iconName={category.icon_name} />
                        {category.name}
                    </button>
                ))}
            </div>
        </div>
    );
}