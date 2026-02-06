# Real Supabase Schema Definition
# WARNING: Foreign Keys require explicit resolution (UUID parsing) before use.

SCHEMA_DEFINITION = """
ENUMS:
- account_type: 'asset', 'liability', 'income', 'expense'
- audit_action: 'insert', 'update', 'delete'
- contract_type: 'permanent', 'contract'
- status: 'active', 'resigned', 'terminated'
- employment_type: 'full_time', 'part_time', 'contract'
- filing_type: 'SST', 'PCB', 'CorporateTax'
- gender: 'male', 'female', 'other'
- invoice_status: 'draft', 'issued', 'paid'
- payroll_status: 'draft', 'processed', 'locked'
- tax_resident_status: 'resident', 'non_resident'

TABLES:

Table: audit_log
- id: uuid (PK)
- entity: text
- entity_id: uuid
- action: audit_action
- performed_by: uuid
- timestamp: timestamp

Table: chart_of_account
- id: uuid (PK)
- account_code: text (Unique)
- account_name: text
- account_type: account_type
- created_at: timestamp

Table: company
- id: uuid (PK)
- legal_name: text
- registration_no: text
- tax_id: text
- sst_registration_no: text
- financial_year_start: date
- created_at: timestamp

Table: customer
- id: uuid (PK)
- person_id: uuid (FK -> person.id) [CRITICAL: Must resolve Person ID first]
- company_name: text
- sst_no: text
- billing_address: text
- created_at: timestamp

Table: ea_form
- id: uuid (PK)
- employee_id: uuid (FK -> employee.id) [CRITICAL: Must resolve Employee ID first]
- year: integer
- total_gross: numeric
- total_epf: numeric
- total_pcb: numeric
- generated_at: timestamp

Table: employee
- id: uuid (PK)
- person_id: uuid (FK -> person.id) [CRITICAL: Must resolve Person ID first]
- company_id: uuid (FK -> company.id) [CRITICAL: Must resolve Company ID first]
- employee_no: text (Unique)
- hire_date: date
- termination_date: date
- employment_type: employment_type
- department: text
- status: status
- created_at: timestamp

Table: employment_contract
- id: uuid (PK)
- employee_id: uuid (FK -> employee.id) [CRITICAL: Must resolve Employee ID first]
- start_date: date
- end_date: date
- base_salary: numeric
- allowance_json: jsonb
- contract_type: contract_type
- created_at: timestamp

Table: general_ledger
- id: uuid (PK)
- account_id: uuid (FK -> chart_of_account.id) [CRITICAL: Must resolve Account ID first]
- debit: numeric
- credit: numeric
- reference_type: text
- reference_id: uuid
- posted_at: timestamp

Table: invoice
- id: uuid (PK)
- customer_id: uuid (FK -> customer.id) [CRITICAL: Must resolve Customer ID first]
- invoice_no: text (Unique)
- invoice_date: date
- subtotal: numeric
- sst_amount: numeric
- total_amount: numeric
- status: invoice_status
- created_at: timestamp

Table: invoice_line
- id: uuid (PK)
- invoice_id: uuid (FK -> invoice.id) [CRITICAL: Must resolve Invoice ID first]
- description: text
- quantity: integer
- unit_price: numeric
- line_total: numeric

Table: payroll_run
- id: uuid (PK)
- company_id: uuid (FK -> company.id) [CRITICAL: Must resolve Company ID first]
- payroll_month: integer
- payroll_year: integer
- processed_at: timestamp
- status: payroll_status

Table: payslip
- id: uuid (PK)
- payroll_run_id: uuid (FK -> payroll_run.id) [CRITICAL: Must resolve PayrollRun ID first]
- employee_id: uuid (FK -> employee.id) [CRITICAL: Must resolve Employee ID first]
- gross_salary: numeric
- epf_employee: numeric
- epf_employer: numeric
- socso_employee: numeric
- socso_employer: numeric
- eis_employee: numeric
- eis_employer: numeric
- pcb_amount: numeric
- net_salary: numeric
- created_at: timestamp

Table: person
- id: uuid (PK)
- full_name: text
- ic_no: text
- passport_no: text
- nationality: text
- date_of_birth: date
- gender: gender
- created_at: timestamp

Table: revenue_recognition
- id: uuid (PK)
- invoice_id: uuid (FK -> invoice.id) [CRITICAL: Must resolve Invoice ID first]
- recognized_amount: numeric
- recognized_date: date

Table: statutory_profile
- id: uuid (PK)
- employee_id: uuid (FK -> employee.id) [CRITICAL: Must resolve Employee ID first]
- epf_no: text
- socso_no: text
- eis_no: text
- pcb_category: text
- tax_resident_status: tax_resident_status
- created_at: timestamp

Table: tax_filing
- id: uuid (PK)
- filing_type: filing_type
- period_start: date
- period_end: date
- submitted_at: timestamp
- reference_no: text
"""
