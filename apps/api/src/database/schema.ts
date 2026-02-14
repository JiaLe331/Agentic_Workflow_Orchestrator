import { pgTable, uuid, text, date, numeric, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { genderEnum, saleStatusEnum } from './enums';
export * from './enums';

// ------------------------------
// EMPLOYEE
// ------------------------------
export const employee = pgTable('employee', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    ic: text('ic').notNull(),
    address: text('address'),
    dateOfBirth: date('date_of_birth', { mode: 'string' }).notNull(),
    gender: genderEnum('gender'),
    // "etc all important stuff" - adding common fields
    email: text('email'),
    phone: text('phone'),
    title: text('title'),
    nationality: text('nationality'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// ------------------------------
// COMPANY
// ------------------------------
export const company = pgTable('company', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    registrationNo: text('registration_no'),
    description: text('description'),
    industry: text('industry'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// ------------------------------
// PAYROLL
// ------------------------------
export const payroll = pgTable('pay_roll', {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id').references(() => employee.id).notNull(),
    salary: numeric('salary', { precision: 12, scale: 2 }), // Basic/Total? User said "salary" and "total salary", "gross salary".
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }),
    epfPercentageEmployee: numeric('epf_percentage_employee', { precision: 5, scale: 2 }),
    epfPercentageCompany: numeric('epf_percentage_company', { precision: 5, scale: 2 }),
    epfCompanyAmount: numeric('epf_company_amount', { precision: 12, scale: 2 }),
    epfIndividualAmount: numeric('epf_individual_amount', { precision: 12, scale: 2 }),
    totalSalary: numeric('total_salary', { precision: 12, scale: 2 }),
    grossSalary: numeric('gross_salary', { precision: 12, scale: 2 }),
    role: text('role'),
    month: integer('month'),
    year: integer('year'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// ------------------------------
// CUSTOMER
// ------------------------------
export const customer = pgTable('customer', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    role: text('role'), // customer role
    companyId: uuid('company_id').references(() => company.id), // "for company that customer is registered with" indicates link to Company
    title: text('title'), // customer title
    email: text('email').unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// ------------------------------
// PRODUCT
// ------------------------------
export const product = pgTable('product', {
    id: uuid('id').defaultRandom().primaryKey(),
    colour: text('colour'),
    itemName: text('item_name').notNull(),
    description: text('description'),
    nettPrice: numeric('nett_price', { precision: 12, scale: 2 }),
    grossPrice: numeric('gross_price', { precision: 12, scale: 2 }),
    sstAmount: numeric('sst_amount', { precision: 12, scale: 2 }),
    manufacturingYear: integer('manufacturing_year'), // 4 digit
    expiryYear: integer('expiry_year'), // 4 digit
    countryOrigin: text('country_origin'),
    supplierId: uuid('supplier_id').references(() => company.id), // supplier (nullable company)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// ------------------------------
// SALE
// ------------------------------
export const sale = pgTable('sale', {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id').references(() => customer.id).notNull(),
    productId: uuid('product_id').references(() => product.id).notNull(),
    unitNumber: integer('unit_number'),
    grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }),
    nettAmount: numeric('nett_amount', { precision: 12, scale: 2 }),
    status: saleStatusEnum('status'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

// ------------------------------
// ONBOARDING
// ------------------------------
export const onboarding = pgTable('onboarding', {
    id: uuid('id').defaultRandom().primaryKey(),
    filtering: boolean('filtering'),
    interviewStage: integer('interview_stage'), // 1 to ...n
    technicalAssessment: boolean('technical_assessment'),
    passed: boolean('passed'),
    onboarded: boolean('onboarded'),
    employeeId: uuid('employee_id').references(() => employee.id), // nullable
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
});

// ------------------------------
// WORKFLOW
// ------------------------------
export const workflow = pgTable('workflow', {
    id: uuid('id').defaultRandom().primaryKey(),
    nodesJson: jsonb('nodes_json'),
    title: text('title'),
    description: text('description'),
    tablesInvolved: text('tables_involved').array(),
    result: text('result'),
    uiType: text('ui_type'),
    uiCode: text('ui_code'),
    workflowUrl: text('workflow_url'),
    webhookUrl: text('webhook_url'), // Added column
    userPrompt: text('user_prompt'), // Added column
    imageUrl: text('image_url'), // Added column
    executionPlan: jsonb('execution_plan'),
    inputRequirements: jsonb('input_requirements'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});
