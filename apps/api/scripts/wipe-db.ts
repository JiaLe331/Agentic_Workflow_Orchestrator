
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the parent directory's .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

async function wipeDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
    });

    try {
        console.log('🗑️  Wiping database...');

        // Disable foreign key checks to allow truncation in any order
        await pool.query('SET session_replication_role = \'replica\';');

        const tables = [
            'workflow',
            'sale',
            'product',
            'customer',
            'pay_roll',
            'onboarding',
            'employee',
            'company',
        ];

        for (const table of tables) {
            // Check if table exists before truncating to avoid errors on first run
            const tableExists = await pool.query(`SELECT to_regclass('public.${table}');`);
            if (tableExists.rows[0].to_regclass) {
                await pool.query(`TRUNCATE TABLE "${table}" CASCADE;`);
            }
        }

        // Re-enable foreign key checks
        await pool.query('SET session_replication_role = \'origin\';');

        console.log('✅ Database wiped successfully.');
    } catch (error) {
        console.error('❌ Error wiping database:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

wipeDatabase();
