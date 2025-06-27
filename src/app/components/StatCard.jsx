'use client';

export default function StatCard({ title, value, icon, format = 'number' }) {
    const formattedValue = format === 'currency'
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
        : value;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
            {icon && <div className="mr-4 text-3xl">{icon}</div>}
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{formattedValue}</p>
            </div>
        </div>
    );
}