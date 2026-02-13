"use client";

import { useState, useEffect } from 'react';
import { BentoCard } from '@/components/BentoCard';
import { Product, fetchProducts, fetchTopProducts } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Package, TrendingUp, DollarSign } from 'lucide-react';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const [allProducts, top] = await Promise.all([
            fetchProducts(),
            fetchTopProducts(10)
        ]);
        setProducts(allProducts);
        setTopProducts(top);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Products Inventory</h1>
                    <p className="text-slate-400">Visual inventory and performance tracking</p>
                </div>

                {/* Hero Section - Top Performing Products Histogram */}
                <BentoCard
                    title="Top Performing Products of the Week"
                    subtitle="Sales volume by product"
                    fullWidth
                >
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={topProducts}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                                dataKey="product_name"
                                stroke="#94a3b8"
                                style={{ fontSize: '12px' }}
                                angle={-45}
                                textAnchor="end"
                                height={100}
                            />
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
                            <Bar dataKey="sales_volume" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </BentoCard>

                {/* Product Showcase - Horizontal Slide-over Card Gallery */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Product Showcase</h2>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                        {loading ? (
                            <div className="text-slate-500">Loading products...</div>
                        ) : products.length === 0 ? (
                            <div className="text-slate-500">No products available</div>
                        ) : (
                            products.slice(0, 10).map((product) => (
                                <div
                                    key={product.id}
                                    className="flex-shrink-0 w-72 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-emerald-600 transition-all hover:shadow-xl hover:shadow-emerald-900/20"
                                >
                                    {/* Product Image Placeholder */}
                                    <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                        <Package className="text-slate-700" size={64} />
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold text-white mb-2 truncate">
                                            {product.item_name}
                                        </h3>
                                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                                            {product.description || 'No description available'}
                                        </p>

                                        {/* Price */}
                                        <div className="flex items-baseline gap-2 mb-3">
                                            <span className="text-2xl font-bold text-emerald-400">
                                                RM {product.nett_price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </span>
                                            {product.gross_price !== product.nett_price && (
                                                <span className="text-sm text-slate-500 line-through">
                                                    RM {product.gross_price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                                </span>
                                            )}
                                        </div>

                                        {/* Stock Status & Details */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">Color:</span>
                                                <span className="text-white">{product.colour || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">Origin:</span>
                                                <span className="text-white">{product.country_origin || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">Year:</span>
                                                <span className="text-white">{product.manufacturing_year || 'N/A'}</span>
                                            </div>

                                            {/* Stock Status Badge */}
                                            <div className="pt-2 mt-2 border-t border-slate-800">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
                                                    In Stock
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Performance Table */}
                <BentoCard
                    title="Product Performance"
                    subtitle="Ranked by sales volume (Last 30 Days)"
                    fullWidth
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rank</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sales Volume</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-slate-500">Loading product data...</td>
                                    </tr>
                                ) : topProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-slate-500">No product data available</td>
                                    </tr>
                                ) : (
                                    topProducts.map((product, index) => (
                                        <tr key={product.id || index} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50' :
                                                        index === 1 ? 'bg-slate-700/30 text-slate-300 border border-slate-600/50' :
                                                            index === 2 ? 'bg-orange-900/30 text-orange-400 border border-orange-800/50' :
                                                                'bg-slate-800/30 text-slate-500'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-white font-medium">
                                                {product.product_name || product.item_name}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-400 max-w-xs truncate">
                                                {product.description || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-emerald-400 text-right font-medium">
                                                RM {(product.nett_price || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-white text-right font-semibold">
                                                {product.sales_volume || 0}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-white text-right font-semibold">
                                                RM {((product.sales_volume || 0) * (product.nett_price || 0)).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
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
