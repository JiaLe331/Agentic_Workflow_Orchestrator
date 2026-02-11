
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the parent directory's .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

async function grantPermissions() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
    });

    try {
        console.log('🔑  Granting permissions...');

        // Grant usage on schema public to roles
        await pool.query('GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;');

        // Grant all privileges on all tables in schema public to roles
        await pool.query('GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;');

        // Grant all privileges on all sequences in schema public to roles
        await pool.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;');

        // Also alter default privileges so future tables get these permissions
        await pool.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;');
        await pool.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;');

        console.log('✅ Permissions granted successfully.');
    } catch (error) {
        console.error('❌ Error granting permissions:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

grantPermissions();
