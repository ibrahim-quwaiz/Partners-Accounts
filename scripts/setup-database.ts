import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { push } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

const { Pool } = pg;

const databaseUrl = process.env.SUPABASE_POOLER_URL || 
                   process.env.SUPABASE_DATABASE_URL || 
                   process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ خطأ: يجب تعيين متغير البيئة DATABASE_URL أو SUPABASE_DATABASE_URL');
  console.error('\nيمكنك إضافة السطر التالي في ملف .env:');
  console.error('DATABASE_URL=postgresql://username:password@localhost:5432/database_name');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool, { schema });

async function setupDatabase() {
  try {
    console.log('🚀 بدء إعداد قاعدة البيانات باستخدام Drizzle...\n');
    
    // استخدام Drizzle push لإنشاء الجداول من schema.ts
    console.log('📝 إنشاء الجداول من shared/schema.ts...\n');
    
    await push(db, {
      migrationsFolder: './migrations',
    });
    
    console.log('✅ تم إنشاء الجداول بنجاح!\n');
    
    // التحقق من الجداول المنشأة
    console.log('📊 التحقق من الجداول المنشأة...\n');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('الجداول الموجودة:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });
    
    // إدراج البيانات الأولية (المشاريع)
    console.log('\n📦 إدراج البيانات الأولية...\n');
    try {
      const existingProjects = await db.select().from(schema.projects);
      if (existingProjects.length === 0) {
        await db.insert(schema.projects).values([
          { name: 'مشروع برج الألفية', description: 'المشروع الأول' },
          { name: 'تجديد السوق المركزي', description: 'المشروع الثاني' },
        ]);
        console.log('✅ تم إدراج المشروعين الافتراضيين');
      } else {
        console.log('⚠️  المشاريع موجودة مسبقاً، تم تخطي الإدراج');
      }
    } catch (error: any) {
      console.log('⚠️  لم يتم إدراج المشاريع:', error.message);
    }
    
    // التحقق من البيانات الأولية
    console.log('\n📦 التحقق من البيانات الأولية...\n');
    const projects = await db.select().from(schema.projects);
    if (projects.length > 0) {
      console.log('المشاريع:');
      projects.forEach(project => {
        console.log(`  - ${project.name} (${project.id})`);
      });
    }
    
    console.log('\n✅ تم إعداد قاعدة البيانات بنجاح!\n');
    console.log('📝 ملاحظات:');
    console.log('  - تم إنشاء جميع الجداول من shared/schema.ts');
    console.log('  - تم إدراج المشروعين الافتراضيين');
    console.log('  - يمكنك الآن تشغيل البرنامج باستخدام: npm run dev\n');
    
  } catch (error: any) {
    console.error('❌ فشل إعداد قاعدة البيانات:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

setupDatabase().catch((error) => {
  console.error('خطأ غير متوقع:', error);
  process.exit(1);
});
