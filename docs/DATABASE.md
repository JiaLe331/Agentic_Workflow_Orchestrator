# Database Standards: SUPABASE ONLY

> [!IMPORTANT]
> **STRICT RULE**: ALL database operations MUST use Supabase. No other database is allowed.

## Overview

This workflow system exclusively uses **Supabase** (PostgreSQL) as its persistence layer. Agents must generate nodes that interact with Supabase using the standard PostgreSQL dialect or the specific n8n Supabase node where appropriate.

## Connection Details

- **Type**: PostgreSQL / Supabase
- **Credentials**: Use the pre-configured `Supabase Credential` in n8n.
- **Schema**: `public`

## Operational Rules

1. **NO Local DBs**: Do not attempt to use SQLite, MySQL, or local JSON files for persistence.
2. **NO Mock Data**: Real data must be fetched/written to Supabase.
3. **Foreign Keys**: Always resolve Foreign Keys using UUIDs existing in Supabase.

## Query Syntax & Patterns

### 1. SELECT (Fetch)

When fetching records, use standard SQL-compliant filters.

```json
{
  "operation": "executeQuery",
  "query": "SELECT * FROM public.employees WHERE email = 'user@example.com';"
}
```

*Note: In the n8n Supabase node, this maps to the "Get Many" or "Execute Query" operation.*

### 2. INSERT (Create)

Must include all `NOT NULL` fields.

```json
{
  "operation": "create",
  "table": "employees",
  "columns": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

### 3. UPDATE

Must target a specific row by ID.

```json
{
  "operation": "update",
  "table": "employees",
  "match_column": "id",
  "match_value": "uuid-1234-5678",
  "update_columns": {
    "status": "active"
  }
}
```

## Migration & Syntax

If migrating from another DB logic:

- **Auto-Increment IDs** -> **UUIDs** (gen_random_uuid())
- **TEXT** -> **TEXT** / **VARCHAR**
- **SNAKE_CASE**: All column names must be `snake_case`.

## Common Errors to Avoid

- **Schema Mismatch**: Ensure the column names exactly match the `SCHEMA_DEFINITION`.
- **Missing FKs**: Do not insert a `company_id` that does not exist in the `companies` table.
