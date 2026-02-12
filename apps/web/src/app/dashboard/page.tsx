'use client';

import { useUniversalData } from '@/hooks/use-universal-data';
import { IconUsers, IconBriefcase, IconRobot, IconDatabase, IconLoader } from '@tabler/icons-react';
import { useState } from 'react';

// Tables available in the schema
const AVAILABLE_TABLES = [
    'employee',
    'onboarding',
    'workflow',
    'company',
    'customer',
    'product',
    'sale',
    'pay_roll'
];

export default function DashboardPage() {
    // Summary Data Fetching (Auto-refresh every 5s)
    const { data: employees, isLoading: loadingEmployees } = useUniversalData('employee', { refreshInterval: 5000 });
    const { data: onboarding, isLoading: loadingOnboarding } = useUniversalData('onboarding', { refreshInterval: 5000 });
    const { data: workflows, isLoading: loadingWorkflows } = useUniversalData('workflow', { refreshInterval: 5000 });

    // God Mode State (Auto-refresh every 3s for fast feedback)
    const [selectedTable, setSelectedTable] = useState('employee');
    const { data: tableData, isLoading: loadingTable } = useUniversalData(selectedTable, { refreshInterval: 3000 });

    // Calculate Stats
    const totalEmployees = employees?.length || 0;
    const candidatesInProcess = onboarding?.filter((c: any) => !c.onboarded).length || 0;
    const activeWorkflows = workflows?.length || 0;

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50 overflow-y-auto">
            {/* Header */}
            <div className="px-8 py-6 mb-6 bg-white border-b border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        Business Overview
                        <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full animate-pulse dark:bg-green-900/30 dark:text-green-400">
                            ● Live
                        </span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Real-time data from your automated operations</p>
                </div>
            </div>

            <div className="px-8 pb-8 space-y-8">
                {/* 1. Summary Cards Section */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard
                        title="Total Employees"
                        value={loadingEmployees ? '...' : totalEmployees}
                        icon={<IconUsers className="text-blue-500" size={32} />}
                        color="blue"
                    />
                    <StatCard
                        title="Candidates in Process"
                        value={loadingOnboarding ? '...' : candidatesInProcess}
                        icon={<IconBriefcase className="text-orange-500" size={32} />}
                        color="orange"
                    />
                    <StatCard
                        title="Active Workflows"
                        value={loadingWorkflows ? '...' : activeWorkflows}
                        icon={<IconRobot className="text-purple-500" size={32} />}
                        color="purple"
                    />
                </div>

                {/* 2. God Mode Data Viewer */}
                <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg dark:bg-gray-700">
                                <IconDatabase size={24} className="text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Explorer</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">View and analyze raw data from any table</p>
                            </div>
                        </div>

                        {/* Table Selector */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Table:</span>
                            <select
                                value={selectedTable}
                                onChange={(e) => setSelectedTable(e.target.value)}
                                className="px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-700 dark:border-gray-600 dark:text-white cursor-pointer"
                            >
                                {AVAILABLE_TABLES.map((table) => (
                                    <option key={table} value={table}>
                                        {table.charAt(0).toUpperCase() + table.slice(1).replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Data Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg dark:border-gray-700">
                        {loadingTable ? (
                            <div className="flex items-center justify-center p-12 text-gray-500">
                                <IconLoader className="animate-spin mr-2" size={20} /> Loading data...
                            </div>
                        ) : tableData && tableData.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                                    <tr>
                                        {Object.keys(tableData[0])
                                            .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
                                            .map((key) => (
                                                <th key={key} className="px-6 py-3 font-medium tracking-wider whitespace-nowrap">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </th>
                                            ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {tableData.map((row: any, i: number) => (
                                        <tr key={i} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50 transition-colors">
                                            {Object.keys(row)
                                                .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
                                                .map((key) => (
                                                    <td key={key} className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                        {formatValue(row[key])}
                                                    </td>
                                                ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                No data found in table "{selectedTable}"
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-xs text-right text-gray-400">
                        Showing {tableData?.length || 0} records
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Component for Summary Cards
function StatCard({ title, value, icon, color }: any) {
    return (
        <div className={`relative overflow-hidden bg-white p-6 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 group hover:shadow-md transition-shadow`}>
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity bg-${color}-500/10 rounded-bl-3xl`}>
                {icon}
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Helper to format table values properly
function formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value).slice(0, 30) + '...';
    if (String(value).match(/^\d{4}-\d{2}-\d{2}T/)) {
        return new Date(value).toLocaleDateString(); // Format dates nicely
    }
    return String(value);
}
