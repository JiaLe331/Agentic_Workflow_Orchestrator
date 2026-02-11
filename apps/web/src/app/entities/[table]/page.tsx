
'use client';

import { useUniversal } from '@/hooks/use-universal';
import { useParams } from 'next/navigation';

export default function EntityViewPage() {
    const params = useParams();
    const table = params.table as string;
    const { data, error, isLoading } = useUniversal(table);

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">Error loading data</div>;

    if (!data || data.length === 0) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6 capitalize">{table.replace(/_/g, ' ')}</h1>
                <p>No records found.</p>
            </div>
        );
    }

    const columns = Object.keys(data[0]);

    return (
        <div className="p-8 overflow-x-auto">
            <h1 className="text-3xl font-bold mb-6 capitalize">{table.replace(/_/g, ' ')}</h1>
            <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="uppercase tracking-wider border-b-2 border-gray-200">
                    <tr>
                        {columns.map((col) => (
                            <th key={col} scope="col" className="px-6 py-4">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                            {columns.map((col) => (
                                <td key={col} className="px-6 py-4">
                                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
