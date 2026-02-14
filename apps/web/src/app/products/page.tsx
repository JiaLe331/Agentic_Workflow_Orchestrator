"use client";

import { useState, useEffect, useMemo } from 'react';
import { BentoCard } from '@/components/BentoCard';
import { Product, fetchProducts, fetchTopProducts } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Package, TrendingUp, DollarSign, Smartphone, Home, Dumbbell, Sparkles, Gamepad2, Coffee, Shirt, BookOpen, Car, Briefcase, ListFilter } from 'lucide-react';

// Category mapping based on product name keywords
type CategoryInfo = {
    name: string;
    icon: React.ElementType;
    gradient: string;
    bgColor: string;
};

const getCategoryInfo = (productName: string): CategoryInfo => {
    const name = productName.toLowerCase();

    // Electronics
    if (name.includes('phone') || name.includes('computer') || name.includes('laptop') ||
        name.includes('tablet') || name.includes('camera') || name.includes('headphone') ||
        name.includes('mouse') || name.includes('keyboard') || name.includes('monitor')) {
        return {
            name: 'Electronics',
            icon: Smartphone,
            gradient: 'from-cyan-400 to-cyan-600',
            bgColor: 'bg-cyan-50'
        };
    }

    // Home & Garden
    if (name.includes('table') || name.includes('chair') || name.includes('sofa') ||
        name.includes('lamp') || name.includes('garden') || name.includes('plant') ||
        name.includes('furniture') || name.includes('home')) {
        return {
            name: 'Home & Garden',
            icon: Home,
            gradient: 'from-green-400 to-green-600',
            bgColor: 'bg-green-50'
        };
    }

    // Sports & Outdoors
    if (name.includes('bike') || name.includes('ball') || name.includes('sport') ||
        name.includes('fitness') || name.includes('outdoor') || name.includes('camping')) {
        return {
            name: 'Sports & Outdoors',
            icon: Dumbbell,
            gradient: 'from-orange-400 to-orange-600',
            bgColor: 'bg-orange-50'
        };
    }

    // Beauty & Health
    if (name.includes('beauty') || name.includes('cosmetic') || name.includes('health') ||
        name.includes('skincare') || name.includes('makeup') || name.includes('perfume')) {
        return {
            name: 'Beauty & Health',
            icon: Sparkles,
            gradient: 'from-pink-400 to-pink-600',
            bgColor: 'bg-pink-50'
        };
    }

    // Toys & Games
    if (name.includes('toy') || name.includes('game') || name.includes('puzzle') ||
        name.includes('doll') || name.includes('lego') || name.includes('play')) {
        return {
            name: 'Toys & Games',
            icon: Gamepad2,
            gradient: 'from-purple-400 to-purple-600',
            bgColor: 'bg-purple-50'
        };
    }

    // Food & Beverage
    if (name.includes('food') || name.includes('drink') || name.includes('coffee') ||
        name.includes('tea') || name.includes('snack') || name.includes('beverage')) {
        return {
            name: 'Food & Beverage',
            icon: Coffee,
            gradient: 'from-amber-400 to-amber-600',
            bgColor: 'bg-amber-50'
        };
    }

    // Clothing & Fashion
    if (name.includes('shirt') || name.includes('pants') || name.includes('dress') ||
        name.includes('shoes') || name.includes('fashion') || name.includes('clothing')) {
        return {
            name: 'Clothing & Fashion',
            icon: Shirt,
            gradient: 'from-violet-400 to-violet-600',
            bgColor: 'bg-violet-50'
        };
    }

    // Books & Media
    if (name.includes('book') || name.includes('magazine') || name.includes('media') ||
        name.includes('dvd') || name.includes('music')) {
        return {
            name: 'Books & Media',
            icon: BookOpen,
            gradient: 'from-teal-400 to-teal-600',
            bgColor: 'bg-teal-50'
        };
    }

    // Automotive
    if (name.includes('car') || name.includes('auto') || name.includes('vehicle') ||
        name.includes('tire') || name.includes('motor')) {
        return {
            name: 'Automotive',
            icon: Car,
            gradient: 'from-red-400 to-red-600',
            bgColor: 'bg-red-50'
        };
    }

    // Office Supplies (default)
    return {
        name: 'Office Supplies',
        icon: Briefcase,
        gradient: 'from-emerald-400 to-emerald-600',
        bgColor: 'bg-emerald-50'
    };
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'revenue' | 'volume'>('revenue');

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
        // Ensure strictly sorted by sales volume descending
        setTopProducts(top.sort((a: any, b: any) => b.sales_volume - a.sales_volume));
        setLoading(false);
    };

    const sortedTopProducts = useMemo(() => {
        const sorted = [...topProducts];
        if (sortBy === 'revenue') {
            return sorted.sort((a, b) => {
                const revenueA = (a.sales_volume || 0) * (a.nett_price || 0);
                const revenueB = (b.sales_volume || 0) * (b.nett_price || 0);
                return revenueB - revenueA;
            });
        } else {
            return sorted.sort((a, b) => (b.sales_volume || 0) - (a.sales_volume || 0));
        }
    }, [topProducts, sortBy]);

    // ... (rest of the component)

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-4xl font-normal text-gray-900 mb-2">Products Inventory</h1>
                    <p className="text-gray-500">Visual inventory and performance tracking</p>
                </div>

                {/* Hero Section - Top Performing Products Histogram */}
                {/* ... (Hero chart remains using topProducts or sortedTopProducts? The request implies "Product Performance" table, but maybe histogram too? Usually histogram follows same logic. Let's use sortedTopProducts for histogram too for consistency, or keep it volume based if it specifically says "Sales volume by product". The subtitle says "Sales volume by product". I'll keep the histogram on volume for now unless requested, to match subtitle.) */}
                <BentoCard
                    title="Top Performing Products of the Week"
                    subtitle="Sales volume by product"
                    fullWidth

                >
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                            data={topProducts}
                            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                        >
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(142.1 70% 30%)" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="hsl(240 5.9% 90%)"
                                horizontal={true}
                            />
                            <XAxis
                                dataKey="product_name"
                                tickMargin={14}
                                axisLine={false}
                                tickLine={false}
                                stroke="hsl(240 5.3% 26.1%)"
                                fontSize={11}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                                interval={0}
                                minTickGap={10}
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
                            />
                            <Bar
                                dataKey="sales_volume"
                                fill="url(#barGradient)"
                                radius={[8, 8, 0, 0]}
                                name="Sales Volume"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </BentoCard>

                {/* Product Showcase - Horizontal Slide-over Card Gallery */}
                <div>
                    <h2 className="text-2xl font-medium text-gray-900 mb-4">Product Showcase</h2>
                    <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {loading ? (
                            <div className="text-gray-500">Loading products...</div>
                        ) : products.length === 0 ? (
                            <div className="text-gray-500">No products available</div>
                        ) : (
                            products.slice(0, 10).map((product) => (
                                <div
                                    key={product.id}
                                    className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-emerald-500 transition-all hover:shadow-xl hover:shadow-emerald-100"
                                >
                                    {/* Product Image - Category Based Illustration */}
                                    {(() => {
                                        const category = getCategoryInfo(product.item_name);
                                        const CategoryIcon = category.icon;
                                        return (
                                            <div className={`h-48 ${category.bgColor} overflow-hidden relative flex items-center justify-center group`}>
                                                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                                                <CategoryIcon className="w-24 h-24 text-gray-400 group-hover:text-gray-500 transition-all duration-300 group-hover:scale-110" strokeWidth={1.5} />
                                                <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                                                    {category.name}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Product Details */}
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                                            {product.item_name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                            {product.description || 'No description available'}
                                        </p>

                                        {/* Price */}
                                        <div className="flex items-baseline gap-2 mb-3">
                                            <span className="text-2xl font-bold text-emerald-600">
                                                RM {product.nett_price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        {/* Stock Status & Details */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">Color:</span>
                                                <span className="text-gray-900">{product.colour || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">Origin:</span>
                                                <span className="text-gray-900">{product.country_origin || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">Year:</span>
                                                <span className="text-gray-900">{product.manufacturing_year || 'N/A'}</span>
                                            </div>

                                            {/* Stock Status Badge */}
                                            <div className="pt-2 mt-2 border-t border-gray-100">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
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
                    subtitle={`Ranked by ${sortBy === 'revenue' ? 'revenue' : 'sales volume'} (Last 30 Days)`}
                    fullWidth
                    headerAction={
                        <div className="flex items-center gap-2">
                            <ListFilter className="w-4 h-4 text-gray-500" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'revenue' | 'volume')}
                                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                            >
                                <option value="revenue">Sort by Revenue</option>
                                <option value="volume">Sort by Volume</option>
                            </select>
                        </div>
                    }
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            {/* ... (thead) */}
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales Volume</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">Loading product data...</td>
                                    </tr>
                                ) : sortedTopProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">No product data available</td>
                                    </tr>
                                ) : (
                                    sortedTopProducts.map((product, index) => (
                                        <tr key={product.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            {/* ... (rows) */}
                                            <td className="py-3 px-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                    index === 1 ? 'bg-gray-200 text-gray-700 border border-gray-300' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                            'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                                                {product.product_name || product.item_name}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                                                {product.description || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-emerald-600 text-right font-medium">
                                                RM {(product.nett_price || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 text-right font-semibold">
                                                {product.sales_volume || 0}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 text-right font-semibold">
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
