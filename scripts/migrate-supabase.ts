import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const connectionString = process.env.SUPABASE_POOLER_URL || process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  console.error('SUPABASE_POOLER_URL or SUPABASE_DATABASE_URL must be set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting Supabase migration...');
    
    // 1. Check if user_profiles exists and drop it
    const userProfilesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
      ) as exists
    `);
    
    if (userProfilesCheck.rows[0].exists) {
      console.log('Dropping user_profiles table...');
      await client.query('DROP TABLE IF EXISTS user_profiles CASCADE');
      console.log('user_profiles table dropped.');
    } else {
      console.log('user_profiles table does not exist.');
    }
    
    // 2. Check partners table structure
    console.log('\nChecking partners table structure...');
    const partnersColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'partners'
    `);
    
    const existingColumns = partnersColumns.rows.map(r => r.column_name);
    console.log('Existing columns:', existingColumns.join(', '));
    
    // 3. Create user_role enum if not exists
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'TX_ONLY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('user_role enum ensured.');
    
    // 4. Add missing columns to partners
    if (!existingColumns.includes('username')) {
      console.log('Adding username column...');
      await client.query('ALTER TABLE partners ADD COLUMN username text UNIQUE');
    }
    
    if (!existingColumns.includes('password')) {
      console.log('Adding password column...');
      await client.query('ALTER TABLE partners ADD COLUMN password text');
    }
    
    if (!existingColumns.includes('role')) {
      console.log('Adding role column...');
      await client.query('ALTER TABLE partners ADD COLUMN role user_role DEFAULT \'TX_ONLY\' NOT NULL');
    }
    
    // 5. Set credentials for partners
    console.log('\nSetting partner credentials...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update P1 (ibrahim - ADMIN)
    await client.query(`
      UPDATE partners 
      SET username = 'ibrahim', password = $1, role = 'ADMIN'
      WHERE id = 'P1'
    `, [hashedPassword]);
    console.log('P1 (ibrahim) updated with ADMIN role');
    
    // Update P2 (nahed - TX_ONLY)
    await client.query(`
      UPDATE partners 
      SET username = 'nahed', password = $1, role = 'TX_ONLY'
      WHERE id = 'P2'
    `, [hashedPassword]);
    console.log('P2 (nahed) updated with TX_ONLY role');
    
    // 6. Verify partners
    console.log('\nVerifying partners table:');
    const partners = await client.query('SELECT id, display_name, username, role FROM partners');
    console.table(partners.rows);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nLogin credentials:');
    console.log('  ibrahim / admin123 (ADMIN)');
    console.log('  nahed / admin123 (TX_ONLY)');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
