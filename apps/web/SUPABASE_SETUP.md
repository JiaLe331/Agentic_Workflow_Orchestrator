# Supabase Integration Setup

## Installation

The Supabase client package needs to be installed. Run this command in the `apps/web` directory:

```bash
npm install @supabase/supabase-js
```

## Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Features Implemented

### Sales Page (`/sales`)
- ✅ **Relational Joins**: Fetches product and customer data with sales using `.select('*, product:product_id(...), customer:customer_id(...)')`
- ✅ **Time Range Filtering**: Uses `.gte('created_at', cutoffDate)` to filter by "Last 24 Hours" or "Last 7 Days"
- ✅ **Real-time Updates**: Subscribes to `postgres_changes` on the `sale` table for automatic updates
- ✅ **Tax Calculation**: Computed in frontend as `gross_amount - nett_amount`

### Products Page (`/products`)
- ✅ **Top Products Query**: Aggregates sales data by product_id to calculate sales volume
- ✅ **Product Joins**: Fetches product details with sales data for the last 7 days
- ✅ **Performance Ranking**: Sorts products by sales volume and displays top 10

### Employees Page (`/employees`)
- ✅ **Optimized Loading**: Initial list fetch without detailed payroll
- ✅ **Single-Row Query**: On click, fetches specific employee with `fetchEmployeeById()`
- ✅ **Current Month Payroll**: Filters payroll by current month and year using `.eq('month', currentMonth).eq('year', currentYear)`
- ✅ **Slide-over Details**: Displays comprehensive employee profile and payslip

## Query Examples

### Sales with Relational Data
```typescript
const { data } = await supabase
  .from('sale')
  .select(`
    *,
    product:product_id (item_name, nett_price, gross_price),
    customer:customer_id (name, email)
  `)
  .gte('created_at', cutoffDate.toISOString())
  .order('created_at', { ascending: false });
```

### Real-time Subscription
```typescript
const channel = supabase
  .channel('sales-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'sale'
  }, (payload) => {
    console.log('Change detected:', payload);
    // Reload data
  })
  .subscribe();
```

### Employee with Payroll
```typescript
const { data: employee } = await supabase
  .from('employee')
  .select('*')
  .eq('id', employeeId)
  .single();

const { data: payroll } = await supabase
  .from('pay_roll')
  .select('*')
  .eq('employee_id', employeeId)
  .eq('month', currentMonth)
  .eq('year', currentYear)
  .single();
```

## Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the pages:
   - Sales: http://localhost:3000/sales
   - Products: http://localhost:3000/products
   - Employees: http://localhost:3000/employees

3. Test real-time updates:
   - Open the Sales page
   - Insert a new sale record in Supabase
   - Watch the page update automatically

## Troubleshooting

### Module not found error
If you see "Cannot find module '@supabase/supabase-js'", install it:
```bash
cd apps/web
npm install @supabase/supabase-js
```

### No data showing
1. Check that `.env.local` has correct Supabase credentials
2. Verify your Supabase tables have data
3. Check browser console for error messages
4. Ensure RLS (Row Level Security) policies allow read access

### Real-time not working
1. Verify Supabase Realtime is enabled for the `sale` table
2. Check that your Supabase plan supports Realtime
3. Look for subscription errors in the browser console
