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
    
    // 6. Update event_logs table - fix partner_id column type
    console.log('\nUpdating event_logs table...');
    const eventLogsColumns = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'event_logs'
    `);
    const eventLogsCols = eventLogsColumns.rows;
    const partnerIdCol = eventLogsCols.find(c => c.column_name === 'partner_id');
    const userIdCol = eventLogsCols.find(c => c.column_name === 'user_id');
    
    if (userIdCol && !partnerIdCol) {
      console.log('Dropping old user_id column and adding partner_id...');
      await client.query('ALTER TABLE event_logs DROP COLUMN user_id');
      await client.query('ALTER TABLE event_logs ADD COLUMN partner_id partner_id');
    } else if (partnerIdCol && partnerIdCol.udt_name !== 'partner_id') {
      console.log('Fixing partner_id column type (current: ' + partnerIdCol.udt_name + ')...');
      await client.query('ALTER TABLE event_logs DROP COLUMN partner_id');
      await client.query('ALTER TABLE event_logs ADD COLUMN partner_id partner_id');
    } else if (!partnerIdCol) {
      console.log('Adding partner_id column...');
      await client.query('ALTER TABLE event_logs ADD COLUMN partner_id partner_id');
    } else {
      console.log('partner_id column already correct type');
    }
    
    // 7. Update transactions table - add created_by column
    console.log('\nUpdating transactions table...');
    const txColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
    `);
    const txColNames = txColumns.rows.map(r => r.column_name);
    
    if (!txColNames.includes('created_by')) {
      console.log('Adding created_by column...');
      await client.query('ALTER TABLE transactions ADD COLUMN created_by partner_id');
    }
    
    // 8. Drop unused period_partner_balances table if exists
    console.log('\nDropping unused period_partner_balances table...');
    await client.query('DROP TABLE IF EXISTS period_partner_balances CASCADE');
    console.log('period_partner_balances table dropped (if existed).');
    
    // 9. Verify partners
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
