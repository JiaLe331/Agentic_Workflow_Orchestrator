"use client";

import { useState, useEffect, useMemo } from 'react';
import { BentoCard } from '@/components/BentoCard';
import { Sale, fetchSales, subscribeSalesUpdates, unsubscribe } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { IconTrendingUp, IconCurrencyDollar, IconReceipt } from '@tabler/icons-react';
import { formatRelativeTime } from '@/lib/dateUtils';

export default function SalesPage() {
    const [timeRange, setTimeRange] = useState<'24h' | '7d'>('7d');
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

    // Calculate aggregated data for charts with proper date formatting
    const chartData = useMemo(() => {
        if (timeRange === '24h') {
            // For 24 hours: Show 5 time points (0000, 0600, 1200, 1800, 2400)
            // Each represents the START of that time period
            const intervals = ['0000', '0600', '1200', '1800', '2400'];
            const result = intervals.map(time => ({
                date: time,
                revenue: 0,
                profit: 0,
                tax: 0
            }));

            sales.forEach(sale => {
                const saleDate = new Date(sale.created_at);
                const hour = saleDate.getHours();
                const tax = sale.nett_amount - sale.gross_amount;

                // Map hours to correct interval index
                // 0-5 → index 0 (0000), 6-11 → index 1 (0600), 
                // 12-17 → index 2 (1200), 18-23 → index 3 (1800)
                let index = Math.floor(hour / 6);

                if (index >= 0 && index <= 3) {
                    result[index].revenue += sale.nett_amount;
                    result[index].profit += sale.gross_amount;
                    result[index].tax += tax;
                }
            });

            // 2400 (index 4) stays at 0 - it's just the end marker for the chart
            console.log('24h Chart Data:', result);
            return result;
        } else {
            // For 7 days: Ensure all 7 days are shown with accurate data
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const now = new Date();
            const result: any[] = [];

            console.log('Current date/time:', now.toISOString(), 'Day:', dayNames[now.getDay()]);

            // Initialize last 7 days (from 6 days ago to today)
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0); // Start of day
                const dayKey = date.toISOString().split('T')[0];
                const dayName = dayNames[date.getDay()];

                console.log(`Day ${6 - i}: ${dayName} (${dayKey}), dayIndex: ${date.getDay()}`);

                result.push({
                    date: dayName,
                    dateKey: dayKey,
                    dayIndex: date.getDay(),
                    revenue: 0,
                    profit: 0,
                    tax: 0
                });
            }

            console.log('Initialized days:', result.map(d => d.date).join(', '));

            // Aggregate sales data by day
            sales.forEach(sale => {
                const saleDate = new Date(sale.created_at);
                saleDate.setHours(0, 0, 0, 0); // Normalize to start of day
                const dayKey = saleDate.toISOString().split('T')[0];
                const tax = sale.nett_amount - sale.gross_amount;

                const dayData = result.find(d => d.dateKey === dayKey);
                if (dayData) {
                    dayData.revenue += sale.nett_amount;
                    dayData.profit += sale.gross_amount;
                    dayData.tax += tax;
                }
            });

            // Return clean data without internal keys
            const finalResult = result.map(({ date, revenue, profit, tax }) => ({
                date,
                revenue,
                profit,
                tax
            }));

            console.log('7d Chart Data (final):', finalResult);
            console.log('Days in chart:', finalResult.map(d => d.date).join(', '));
            return finalResult;
        }
    }, [sales, timeRange]);

    // Calculate cumulative data (running totals) for the second chart
    const cumulativeChartData = useMemo(() => {
        let cumulativeRevenue = 0;
        let cumulativeProfit = 0;
        let cumulativeTax = 0;

        return chartData.map(item => {
            cumulativeRevenue += item.revenue;
            cumulativeProfit += item.profit;
            cumulativeTax += item.tax;

            return {
                date: item.date,
                revenue: cumulativeRevenue,
                profit: cumulativeProfit,
                tax: cumulativeTax
            };
        });
    }, [chartData]);

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
                        <h1 className="text-4xl font-normal text-gray-900 mb-2">Sales Dashboard</h1>
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
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <IconCurrencyDollar className="text-gray-700" size={24} stroke={1.5} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Revenue</p>
                                <p className="text-2xl font-semibold text-gray-900">RM {totals.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <IconTrendingUp className="text-gray-700" size={24} stroke={1.5} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Profit</p>
                                <p className="text-2xl font-semibold text-gray-900">RM {totals.profit.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <IconReceipt className="text-gray-700" size={24} stroke={1.5} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Tax</p>
                                <p className="text-2xl font-semibold text-gray-900">RM {totals.tax.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
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
                            <AreaChart
                                data={chartData}
                                margin={{ top: 10, right: 50, left: 20, bottom: 10 }}
                            >
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(280 100% 70%)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="hsl(280 100% 70%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(240 5.9% 90%)"
                                    vertical={false}
                                    horizontal={true}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="hsl(240 5.3% 26.1%)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    interval={0}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(0 0% 100%)',
                                        border: '1px solid hsl(240 5.9% 90%)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                    labelStyle={{
                                        color: 'hsl(240 10% 3.9%)',
                                        fontWeight: 600,
                                        marginBottom: '8px'
                                    }}
                                    formatter={(value: any) => [`RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, '']}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="circle"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="hsl(142.1 76.2% 36.3%)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    name="Revenue"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="profit"
                                    stroke="hsl(221.2 83.2% 53.3%)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorProfit)"
                                    name="Profit"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="tax"
                                    stroke="hsl(280 100% 70%)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorTax)"
                                    name="Tax"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </BentoCard>

                    {/* Cumulative Trends Chart */}
                    <BentoCard
                        title="Cumulative Trends"
                        subtitle="Running totals over time"
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart
                                data={cumulativeChartData}
                                margin={{ top: 10, right: 50, left: 20, bottom: 10 }}
                            >
                                <defs>
                                    <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTax2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(280 100% 70%)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="hsl(280 100% 70%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(240 5.9% 90%)"
                                    vertical={false}
                                    horizontal={true}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="hsl(240 5.3% 26.1%)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    interval={0}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(0 0% 100%)',
                                        border: '1px solid hsl(240 5.9% 90%)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                    labelStyle={{
                                        color: 'hsl(240 10% 3.9%)',
                                        fontWeight: 600,
                                        marginBottom: '8px'
                                    }}
                                    formatter={(value: any) => [`RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, '']}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="circle"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="hsl(142.1 76.2% 36.3%)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue2)"
                                    name="Revenue"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="profit"
                                    stroke="hsl(221.2 83.2% 53.3%)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorProfit2)"
                                    name="Profit"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="tax"
                                    stroke="hsl(280 100% 70%)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorTax2)"
                                    name="Tax"
                                />
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
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Units</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nett</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
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
                                            <td className="py-3 px-4 text-sm text-gray-600 text-right font-medium">
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
                                            <td className="py-3 px-4 text-sm text-gray-500 text-right">
                                                {formatRelativeTime(sale.created_at)}
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