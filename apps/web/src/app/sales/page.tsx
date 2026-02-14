"use client";

import { useState, useEffect } from 'react';
import { BentoCard } from '@/components/BentoCard';
import { Sale, fetchSales, subscribeSalesUpdates, unsubscribe } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Receipt } from 'lucide-react';

export default function SalesPage() {
    const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSales();

        // Set up real-time subscription
        const channel = subscribeSalesUpdates((payload) => {
            console.log('Real-time update:', payload);
            // Reload sales data when changes occur
            loadSales();
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribe(channel);
        };
    }, [timeRange]);

    const loadSales = async () => {
        setLoading(true);
        const data = await fetchSales(timeRange);
        setSales(data);
        setLoading(false);
    };

    // Calculate aggregated data for charts
    const chartData = sales.reduce((acc: any[], sale) => {
        const date = new Date(sale.created_at).toLocaleDateString();
        const existing = acc.find(item => item.date === date);
        const tax = sale.nett_amount - sale.gross_amount;

        if (existing) {
            existing.revenue += sale.nett_amount;
            existing.profit += sale.gross_amount;
            existing.tax += tax;
        } else {
            acc.push({
                date,
                revenue: sale.nett_amount,
                profit: sale.gross_amount,
                tax
            });
        }
        return acc;
    }, []);

    // Calculate totals for KPI cards
    const totals = sales.reduce((acc, sale) => {
        acc.revenue += sale.nett_amount;
        acc.profit += sale.gross_amount;
        acc.tax += (sale.nett_amount - sale.gross_amount);
        return acc;
    }, { revenue: 0, profit: 0, tax: 0 });

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Sales Dashboard</h1>
                        <p className="text-gray-500">Track revenue, profit, and tax metrics</p>
                    </div>

                    {/* Time Range Toggle */}
                    <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setTimeRange('24h')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === '24h'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            Last 24 Hours
                        </button>
                        <button
                            onClick={() => setTimeRange('7d')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === '7d'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            Last 7 Days
                        </button>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <DollarSign className="text-emerald-600" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">RM {totals.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <TrendingUp className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Profit</p>
                                <p className="text-2xl font-bold text-gray-900">RM {totals.profit.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Receipt className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Tax</p>
                                <p className="text-2xl font-bold text-gray-900">RM {totals.tax.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Last 24 Hours / 7 Days Chart */}
                    <BentoCard
                        title={timeRange === '24h' ? 'Last 24 Hours' : 'Past Week Trends'}
                        subtitle="Revenue, Profit, and Tax breakdown"
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        color: '#0f172a',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="profit" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProfit)" />
                                <Area type="monotone" dataKey="tax" stroke="#a855f7" fillOpacity={1} fill="url(#colorTax)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </BentoCard>

                    {/* Duplicate chart for second KPI card */}
                    <BentoCard
                        title="Cumulative Trends"
                        subtitle="Overall performance metrics"
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTax2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        color: '#0f172a',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue2)" />
                                <Area type="monotone" dataKey="profit" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProfit2)" />
                                <Area type="monotone" dataKey="tax" stroke="#a855f7" fillOpacity={1} fill="url(#colorTax2)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </BentoCard>
                </div>

                {/* Sales Ledger Table */}
                <BentoCard title="Sales Ledger" subtitle="Complete transaction history" fullWidth>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Units</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nett</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500">Loading sales data...</td>
                                    </tr>
                                ) : sales.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500">No sales data available</td>
                                    </tr>
                                ) : (
                                    sales.map((sale) => (
                                        <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {new Date(sale.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                                                {sale.product?.item_name || `Product ${sale.product_id.slice(0, 8)}`}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {sale.customer?.name || `Customer ${sale.customer_id.slice(0, 8)}`}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 text-right">
                                                {sale.unit_number}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                                                RM {sale.nett_amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 text-right">
                                                RM {sale.gross_amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-purple-600 text-right font-medium">
                                                RM {(sale.nett_amount - sale.gross_amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${sale.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                    sale.status === 'unpaid' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                        'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                    }`}>
                                                    {sale.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>
            </div>
        </div>
    );
}
