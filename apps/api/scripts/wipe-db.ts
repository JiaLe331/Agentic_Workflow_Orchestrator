
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

        // Drop the public schema and recreate it.
        // This removes all tables, views, types, etc. in the public schema.
        await pool.query('DROP SCHEMA public CASCADE;');
        await pool.query('CREATE SCHEMA public;');
        await pool.query('GRANT ALL ON SCHEMA public TO public;');
        await pool.query("COMMENT ON SCHEMA public IS 'standard public schema';");

        console.log('✅ Database wiped successfully.');
    } catch (error) {
        console.error('❌ Error wiping database:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

wipeDatabase();
