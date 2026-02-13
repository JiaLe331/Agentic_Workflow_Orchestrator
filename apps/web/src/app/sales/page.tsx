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
        const tax = sale.gross_amount - sale.nett_amount;

        if (existing) {
            existing.revenue += sale.gross_amount;
            existing.profit += sale.nett_amount;
            existing.tax += tax;
        } else {
            acc.push({
                date,
                revenue: sale.gross_amount,
                profit: sale.nett_amount,
                tax
            });
        }
        return acc;
    }, []);

    // Calculate totals for KPI cards
    const totals = sales.reduce((acc, sale) => {
        acc.revenue += sale.gross_amount;
        acc.profit += sale.nett_amount;
        acc.tax += (sale.gross_amount - sale.nett_amount);
        return acc;
    }, { revenue: 0, profit: 0, tax: 0 });

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Sales Dashboard</h1>
                        <p className="text-slate-400">Track revenue, profit, and tax metrics</p>
                    </div>

                    {/* Time Range Toggle */}
                    <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setTimeRange('24h')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === '24h'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Last 24 Hours
                        </button>
                        <button
                            onClick={() => setTimeRange('7d')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === '7d'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Last 7 Days
                        </button>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-3xl p-6 border border-emerald-800/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-emerald-600/20 rounded-xl">
                                <DollarSign className="text-emerald-400" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Revenue</p>
                                <p className="text-2xl font-bold text-white">RM {totals.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-3xl p-6 border border-blue-800/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-blue-600/20 rounded-xl">
                                <TrendingUp className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Profit</p>
                                <p className="text-2xl font-bold text-white">RM {totals.profit.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-3xl p-6 border border-purple-800/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-purple-600/20 rounded-xl">
                                <Receipt className="text-purple-400" size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Tax</p>
                                <p className="text-2xl font-bold text-white">RM {totals.tax.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
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
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        color: '#fff'
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
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        color: '#fff'
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
                                <tr className="border-b border-slate-800">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Units</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nett</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tax</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-slate-500">Loading sales data...</td>
                                    </tr>
                                ) : sales.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-slate-500">No sales data available</td>
                                    </tr>
                                ) : (
                                    sales.map((sale) => (
                                        <tr key={sale.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 text-sm text-slate-300">
                                                {new Date(sale.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-white font-medium">
                                                {sale.product?.item_name || `Product ${sale.product_id.slice(0, 8)}`}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-300">
                                                {sale.customer?.name || `Customer ${sale.customer_id.slice(0, 8)}`}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-300 text-right">
                                                {sale.unit_number}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-white text-right font-medium">
                                                RM {sale.gross_amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-300 text-right">
                                                RM {sale.nett_amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-purple-400 text-right font-medium">
                                                RM {(sale.gross_amount - sale.nett_amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${sale.status === 'paid' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' :
                                                    sale.status === 'unpaid' ? 'bg-red-900/30 text-red-400 border border-red-800/50' :
                                                        'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
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
