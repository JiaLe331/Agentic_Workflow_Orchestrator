/**
 * Seed the database with mock data.
 * 
 * Run with:
 * pnpm db:seed
 * 
 * Or manually:
 * pnpm dlx tsx scripts/seed.ts
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/database/schema';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the parent directory's .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

async function seed() {
    const { faker } = await import('@faker-js/faker');
    console.log('🌱 Seeding database...');

    try {
        // 1. Create 10 companies
        console.log('Inserting 10 companies...');
        const companiesData = [];
        for (let i = 0; i < 10; i++) {
            companiesData.push({
                name: faker.company.name(),
                registrationNo: faker.string.alphanumeric(10).toUpperCase(),
                description: faker.company.catchPhrase(),
                industry: faker.commerce.department(),
            });
        }
        const insertedCompanies = await db.insert(schema.company).values(companiesData).returning();

        // 2. Split 5 as Suppliers, 5 as Customers
        const supplierCompanies = insertedCompanies.slice(0, 5);
        const customerCompanies = insertedCompanies.slice(5, 10);

        console.log(`Split into ${supplierCompanies.length} Suppliers and ${customerCompanies.length} Customer Companies.`);

        // 3. Create 30 products linked to Supplier companies
        console.log('Inserting 30 products...');
        const productsData = [];
        for (let i = 0; i < 30; i++) {
            const randomSupplier = faker.helpers.arrayElement(supplierCompanies);

            // Deterministic pricing logic
            const grossPrice = parseFloat(faker.commerce.price({ min: 10, max: 200 }));
            const sstAmount = grossPrice * 0.10; // 10% SST
            const nettPrice = grossPrice + sstAmount;

            productsData.push({
                itemName: faker.commerce.productName(),
                colour: faker.color.human(),
                description: faker.commerce.productDescription(),
                nettPrice: nettPrice.toFixed(2),
                grossPrice: grossPrice.toFixed(2),
                sstAmount: sstAmount.toFixed(2),
                manufacturingYear: faker.date.past().getFullYear(),
                expiryYear: faker.date.future().getFullYear(),
                countryOrigin: faker.location.country(),
                supplierId: randomSupplier.id,
            });
        }
        const insertedProducts = await db.insert(schema.product).values(productsData).returning();

        // 4. Create Customers linked to the other 5 Customer companies
        // Prompt says "Create customers linked to the other 5 companies". Doesn't specify how many.
        // Assuming around 20 customers to generate reasonable sales data.
        console.log('Inserting 20 customers...');
        const customersData = [];
        for (let i = 0; i < 20; i++) {
            const randomCustomerCompany = faker.helpers.arrayElement(customerCompanies);
            customersData.push({
                name: faker.person.fullName(),
                role: 'customer',
                companyId: randomCustomerCompany.id,
                title: faker.person.jobTitle(),
                email: faker.internet.email(),
            });
        }
        const insertedCustomers = await db.insert(schema.customer).values(customersData).returning();

        // 5. Generate at least 100 mock sales
        console.log('Inserting 100 sales...');
        const salesData = [];
        for (let i = 0; i < 100; i++) {
            const randomProduct = faker.helpers.arrayElement(insertedProducts);
            const randomCustomer = faker.helpers.arrayElement(insertedCustomers);
            const unitNumber = faker.number.int({ min: 1, max: 100 });

            // Deterministic sale calculation based on product price
            // Ensure we parse the string values from product back to float for calculation
            const productGrossPrice = parseFloat(randomProduct.grossPrice as string);
            const productNettPrice = parseFloat(randomProduct.nettPrice as string);

            const grossAmount = productGrossPrice * unitNumber;
            const nettAmount = productNettPrice * unitNumber;

            salesData.push({
                customerId: randomCustomer.id,
                productId: randomProduct.id,
                unitNumber: unitNumber,
                grossAmount: grossAmount.toFixed(2),
                nettAmount: nettAmount.toFixed(2),
                status: faker.helpers.arrayElement(['paid', 'unpaid', 'processing']) as 'paid' | 'unpaid' | 'processing',
            });
        }
        await db.insert(schema.sale).values(salesData);

        console.log('✅ Seeding completed successfully.');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
