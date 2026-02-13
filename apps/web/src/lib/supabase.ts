// Supabase client configuration with real-time support
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TypeScript Interfaces
export interface Sale {
    id: string;
    customer_id: string;
    product_id: string;
    unit_number: number;
    gross_amount: number;
    nett_amount: number;
    status: 'paid' | 'unpaid' | 'processing';
    created_at: string;
    updated_at: string;
    product?: Product;
    customer?: Customer;
}

export interface Product {
    id: string;
    colour: string;
    item_name: string;
    description: string;
    nett_price: number;
    gross_price: number;
    sst_amount: number;
    manufacturing_year: number;
    expiry_year: number;
    country_origin: string;
    supplier_id: string;
    created_at: string;
    updated_at: string;
}

export interface Employee {
    id: string;
    name: string;
    ic: string;
    address: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other';
    email: string;
    phone: string;
    title: string;
    nationality: string;
    created_at: string;
    updated_at: string;
}

export interface PayRoll {
    id: string;
    employee_id: string;
    salary: number;
    tax_amount: number;
    epf_percentage_employee: number;
    epf_percentage_company: number;
    epf_company_amount: number;
    epf_individual_amount: number;
    total_salary: number;
    gross_salary: number;
    role: string;
    month: number;
    year: number;
    created_at: string;
    updated_at: string;
}

export interface Customer {
    id: string;
    name: string;
    role: string;
    company_id: string;
    title: string;
    email: string;
    created_at: string;
    updated_at: string;
}

// Fetch sales data with time range and relational joins
export async function fetchSales(timeRange: '24h' | '7d' = '7d'): Promise<Sale[]> {
    try {
        const now = new Date();
        const cutoffDate = new Date();

        if (timeRange === '24h') {
            cutoffDate.setHours(cutoffDate.getHours() - 24);
        } else {
            cutoffDate.setDate(cutoffDate.getDate() - 7);
        }

        const { data, error } = await supabase
            .from('sale')
            .select(`
        *,
        product:product_id (
          id,
          item_name,
          description,
          nett_price,
          gross_price,
          colour,
          country_origin
        ),
        customer:customer_id (
          id,
          name,
          email,
          role
        )
      `)
            .gte('created_at', cutoffDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching sales:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching sales:', error);
        return [];
    }
}

// Fetch all products
export async function fetchProducts(): Promise<Product[]> {
    try {
        const { data, error } = await supabase
            .from('product')
            .select('*')
            .order('item_name', { ascending: true });

        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Fetch top performing products with sales volume
export async function fetchTopProducts(limit: number = 10): Promise<any[]> {
    try {
        // Get sales data grouped by product
        const { data: salesData, error: salesError } = await supabase
            .from('sale')
            .select(`
        product_id,
        unit_number,
        product:product_id (
          id,
          item_name,
          description,
          nett_price,
          gross_price
        )
      `)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (salesError) {
            console.error('Error fetching top products:', salesError);
            return [];
        }

        // Aggregate sales by product
        const productSales = salesData?.reduce((acc: any, sale: any) => {
            const productId = sale.product_id;
            if (!acc[productId]) {
                acc[productId] = {
                    product_id: productId,
                    product_name: sale.product?.item_name || 'Unknown',
                    description: sale.product?.description || '',
                    nett_price: sale.product?.nett_price || 0,
                    gross_price: sale.product?.gross_price || 0,
                    sales_volume: 0
                };
            }
            acc[productId].sales_volume += sale.unit_number || 0;
            return acc;
        }, {});

        // Convert to array and sort by sales volume
        const topProducts = Object.values(productSales || {})
            .sort((a: any, b: any) => b.sales_volume - a.sales_volume)
            .slice(0, limit);

        return topProducts;
    } catch (error) {
        console.error('Error fetching top products:', error);
        return [];
    }
}

// Fetch employees with their latest payroll data
export async function fetchEmployees(): Promise<(Employee & { payroll?: PayRoll })[]> {
    try {
        const { data: employees, error: empError } = await supabase
            .from('employee')
            .select('*')
            .order('name', { ascending: true });

        if (empError) {
            console.error('Error fetching employees:', empError);
            return [];
        }

        // Fetch payroll data for all employees
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const { data: payrolls, error: payError } = await supabase
            .from('pay_roll')
            .select('*')
            .eq('month', currentMonth)
            .eq('year', currentYear);

        if (payError) {
            console.error('Error fetching payroll:', payError);
        }

        // Merge employee and payroll data
        const employeesWithPayroll = employees?.map((emp: Employee) => {
            const payroll = payrolls?.find((p: PayRoll) => p.employee_id === emp.id);
            return {
                ...emp,
                payroll: payroll || undefined
            };
        });

        return employeesWithPayroll || [];
    } catch (error) {
        console.error('Error fetching employees:', error);
        return [];
    }
}

// Fetch single employee with payroll details
export async function fetchEmployeeById(employeeId: string): Promise<(Employee & { payroll?: PayRoll }) | null> {
    try {
        const { data: employee, error: empError } = await supabase
            .from('employee')
            .select('*')
            .eq('id', employeeId)
            .single();

        if (empError) {
            console.error('Error fetching employee:', empError);
            return null;
        }

        // Fetch current month's payroll
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const { data: payroll, error: payError } = await supabase
            .from('pay_roll')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('month', currentMonth)
            .eq('year', currentYear)
            .single();

        if (payError && payError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching payroll:', payError);
        }

        return {
            ...employee,
            payroll: payroll || undefined
        };
    } catch (error) {
        console.error('Error fetching employee by ID:', error);
        return null;
    }
}

// Subscribe to real-time sales updates
export function subscribeSalesUpdates(callback: (payload: any) => void) {
    const channel = supabase
        .channel('sales-changes')
        .on(
            'postgres_changes',
            {
                event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'sale'
            },
            callback
        )
        .subscribe();

    return channel;
}

// Unsubscribe from real-time updates
export function unsubscribe(channel: any) {
    supabase.removeChannel(channel);
}
