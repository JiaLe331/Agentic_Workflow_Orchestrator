# Real Supabase Schema Definition
# WARNING: Foreign Keys require explicit resolution (UUID parsing) before use.

SCHEMA_DEFINITION = """
CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'income', 'expense');
CREATE TYPE "public"."audit_action" AS ENUM('insert', 'update', 'delete');
CREATE TYPE "public"."contract_type" AS ENUM('permanent', 'contract');
CREATE TYPE "public"."status" AS ENUM('active', 'resigned', 'terminated');
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract');
CREATE TYPE "public"."filing_type" AS ENUM('SST', 'PCB', 'CorporateTax');
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'paid');
CREATE TYPE "public"."payroll_status" AS ENUM('draft', 'processed', 'locked');
CREATE TYPE "public"."tax_resident_status" AS ENUM('resident', 'non_resident');

CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" text,
	"entity_id" uuid,
	"action" "audit_action",
	"performed_by" uuid,
	"timestamp" timestamp with time zone DEFAULT now()
);

CREATE TABLE "chart_of_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_code" text,
	"account_name" text,
	"account_type" "account_type",
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chart_of_account_account_code_unique" UNIQUE("account_code")
);

CREATE TABLE "company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_name" text NOT NULL,
	"registration_no" text NOT NULL,
	"tax_id" text NOT NULL,
	"sst_registration_no" text,
	"financial_year_start" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"company_name" text,
	"sst_no" text,
	"billing_address" text,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "ea_form" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"total_gross" numeric(14, 2),
	"total_epf" numeric(14, 2),
	"total_pcb" numeric(14, 2),
	"generated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "employee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_no" text NOT NULL,
	"hire_date" date NOT NULL,
	"termination_date" date,
	"employment_type" "employment_type",
	"department" text NOT NULL,
	"status" "status",
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "employee_employee_no_unique" UNIQUE("employee_no")
);

CREATE TABLE "employment_contract" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"base_salary" numeric(12, 2) NOT NULL,
	"allowance_json" jsonb,
	"contract_type" "contract_type",
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "general_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"debit" numeric(14, 2),
	"credit" numeric(14, 2),
	"reference_type" text,
	"reference_id" uuid,
	"posted_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"invoice_no" text,
	"invoice_date" date,
	"subtotal" numeric(14, 2),
	"sst_amount" numeric(14, 2),
	"total_amount" numeric(14, 2),
	"status" "invoice_status",
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "invoice_invoice_no_unique" UNIQUE("invoice_no")
);

CREATE TABLE "invoice_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text,
	"quantity" integer,
	"unit_price" numeric(12, 2),
	"line_total" numeric(14, 2)
);

CREATE TABLE "payroll_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"payroll_month" integer NOT NULL,
	"payroll_year" integer NOT NULL,
	"processed_at" timestamp with time zone,
	"status" "payroll_status"
);

CREATE TABLE "payslip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"gross_salary" numeric(12, 2),
	"epf_employee" numeric(12, 2),
	"epf_employer" numeric(12, 2),
	"socso_employee" numeric(12, 2),
	"socso_employer" numeric(12, 2),
	"eis_employee" numeric(12, 2),
	"eis_employer" numeric(12, 2),
	"pcb_amount" numeric(12, 2),
	"net_salary" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"ic_no" text,
	"passport_no" text,
	"nationality" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" "gender",
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "revenue_recognition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"recognized_amount" numeric(14, 2),
	"recognized_date" date
);

CREATE TABLE "statutory_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"epf_no" text NOT NULL,
	"socso_no" text NOT NULL,
	"eis_no" text NOT NULL,
	"pcb_category" text NOT NULL,
	"tax_resident_status" "tax_resident_status",
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE "tax_filing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filing_type" "filing_type",
	"period_start" date,
	"period_end" date,
	"submitted_at" timestamp with time zone,
	"reference_no" text
);

ALTER TABLE "customer" ADD CONSTRAINT "customer_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ea_form" ADD CONSTRAINT "ea_form_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "employee" ADD CONSTRAINT "employee_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "employee" ADD CONSTRAINT "employee_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "employment_contract" ADD CONSTRAINT "employment_contract_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "general_ledger" ADD CONSTRAINT "general_ledger_account_id_chart_of_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_account"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payroll_run" ADD CONSTRAINT "payroll_run_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_payroll_run_id_payroll_run_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_run"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "revenue_recognition" ADD CONSTRAINT "revenue_recognition_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "statutory_profile" ADD CONSTRAINT "statutory_profile_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE no action ON UPDATE no action;
"""
