# 🚀 Quick Start - Supabase Integration

## Install Package (Required)

Run this command in the `apps/web` directory:

```bash
npm install @supabase/supabase-js
```

Or from the root:

```bash
cd apps/web && npm install @supabase/supabase-js
```

## Configure Environment

1. Create `.env.local` in `apps/web/`:
```bash
cp .env.example .env.local
```

2. Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Test the Pages

```bash
npm run dev
```

Then visit:
- http://localhost:3000/sales
- http://localhost:3000/products  
- http://localhost:3000/employees

---

## What's Implemented

✅ **Sales Page** - Real-time dashboard with product/customer joins  
✅ **Products Page** - Top performers with sales aggregation  
✅ **Employees Page** - Interactive table with payslip slide-over  
✅ **Real-time Updates** - Auto-refresh on database changes  
✅ **Type Safety** - Full TypeScript support  

See `SUPABASE_INTEGRATION.md` for detailed documentation.
