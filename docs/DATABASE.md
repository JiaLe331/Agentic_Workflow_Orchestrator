# Database Standards: SUPABASE ONLY

> [!IMPORTANT]
> **STRICT RULE**: ALL database operations MUST use Supabase. No other database is allowed.

## Overview

This workflow system exclusively uses **Supabase** (PostgreSQL) as its persistence layer. Agents must generate nodes that interact with Supabase using the standard PostgreSQL dialect or the specific `n8n-nodes-base.supabase` node where appropriate.

## Operational Rules

1. **NO Local DBs**: Do not attempt to use SQLite, MySQL, or local JSON files for persistence.
2. **Foreign Keys**: Always resolve Foreign Keys using UUIDs existing in Supabase.
3. **Schema Compliance**:
    * Reference the `SCHEMA_DEFINITION` for every DB operation.
    * For `CREATE` (Insert): You MUST include ALL `NOT NULL` columns.
    * For `UPDATE`: Identify the row using a Unique Constraint or PK in `filters`.

## 4. STRICT FILTERING RULES (Crucial)

To prevent full table scans and Ensure data integrity, you **MUST** apply filters based on the column type:

| Column Type | Operator | Rule | Example |
| :--- | :--- | :--- | :--- |
| **Status / Enum** | `eq` | **MUST** use exact match. | `status = 'paid'` |
| **UUID / ID** | `eq` | **MUST** use exact match. | `id = 'uuid-1234...'` |
| **Text / Name** | `ilike` | **MUST** use Case-Insensitive match. | `name ilike '%John%'` |
| **Search / Keywords** | `like` / `ilike` | Use partial match for search. | `description ilike '%error%'` |
| **Numbers** | `eq`, `gt`, `lt` | Standard comparison. | `amount > 100` |

> [!WARNING]
> **NEVER** leave `filters` empty for `getAll` operations unless strictly intended to fetch the entire table (which is rare).

## 5. NODE EXAMPLES (n8n JSON)

### A. Fetch Record (SELECT)

*Goal: Get a specific product by ID.*

```json
{
  "parameters": {
    "operation": "getAll",
    "tableId": "product",
    "returnAll": true,
    "filters": {
      "conditions": [
        {
          "keyName": "id",
          "condition": "eq",
          "keyValue": "={{ $json.product_id }}"
        }
      ]
    }
  },
  "id": "fetch_product",
  "name": "Fetch Product",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1
}
```

### B. Search Records (SELECT with ILIKE)

*Goal: Find customers by name (case-insensitive).*

```json
{
  "parameters": {
    "operation": "getAll",
    "tableId": "customer",
    "returnAll": true,
    "filters": {
      "conditions": [
        {
          "keyName": "name",
          "condition": "ilike",
          "keyValue": "={{ '%' + $json.search_term + '%' }}"
        }
      ]
    }
  },
  "id": "search_customer",
  "name": "Search Customer",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1
}
```

### C. Create Record (INSERT)

*Goal: Add a new sale.*

```json
{
  "parameters": {
    "operation": "create",
    "tableId": "sale",
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "product_id": "={{ $json.product_id }}",
        "customer_id": "={{ $json.customer_id }}",
        "quantity": "={{ $json.quantity }}",
        "total_amount": "={{ $json.total_amount }}"
      }
    }
  },
  "id": "create_sale",
  "name": "Create Sale",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1
}
```

### D. Update Record

*Goal: Mark a sale as 'completed'.*

```json
{
  "parameters": {
    "operation": "update",
    "tableId": "sale",
    "updateKey": "id",
    "value": "={{ $json.sale_id }}",
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "status": "completed"
      }
    }
  },
  "id": "update_sale",
  "name": "Update Sale",
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1
}
```

## 6. Advanced Querying

### Relational Lookups

If you need data from multiple tables (e.g., Sale + Product Name), do **NOT** rely on a single "Join" node if it complicates the flow.
**Preferred Pattern**:

1. **Fetch Child**: Get `Sale` rows.
2. **Fetch Parent**: Use `sales.product_id` to fetch `Product` details in a subsequent node (Looping if necessary, or using `In` operator if supported/efficient).

### Javascript Iteration

If complex logic is needed to calculate values based on DB results:

1. Fetch Data (Supabase Node)
2. Function Node (Execute JS code to iterate/transform)
3. Write Data (Supabase Node)

**DO NOT** try to cram complex iterating logic into a single Supabase node query.
