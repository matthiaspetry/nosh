'use client';

export default function InsightList({ title, data, valueKey, valueLabel, format = 'number' }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-lg mb-4 text-gray-700">{title}</h3>
            <ul className="space-y-3">
                {data && data.length > 0 ? (
                    data.map((item, index) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{item.name}</span>
                            <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                {format === 'currency'
                                    ? `$${parseFloat(item[valueKey]).toFixed(2)}`
                                    : item[valueKey]} {valueLabel}
                            </span>
                        </li>
                    ))
                ) : (
                    <p className="text-gray-400 italic">No data available.</p>
                )}
            </ul>
        </div>
    );
}