const { Client } = require('pg');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  let out = [];

  const S = (s) => out.push(s);

  S('=============================================================');
  S('PHASE D V4-A — MIGRATION RECONCILIATION INVESTIGATION');
  S('Read-only evidence package');
  S('=============================================================');
  S('');
  S('Generated: ' + new Date().toISOString());
  S('Git HEAD: ' + execSync('git rev-parse HEAD').toString().trim());
  S('Git branch: ' + execSync('git rev-parse --abbrev-ref HEAD').toString().trim());
  S('');

  // 1. Prisma / Node / DB versions
  S('=== 1. VERSIONS ===');
  try {
    S('Prisma CLI: ' + execSync('npx prisma --version').toString().trim().split('\n').filter(l=>l.includes('prisma')).join(' | '));
  } catch(e) { S('Prisma version: ERROR ' + e.message); }
  S('Node.js: ' + process.version);
  const pgV = await c.query('SHOW server_version');
  S('PostgreSQL server: ' + pgV.rows[0].server_version);
  S('');

  // 2. Exact prisma migrate diff --help (Management requirement C)
  S('=== 2. PRISMA MIGRATE DIFF --help ===');
  try {
    const helpOut = execSync('npx prisma migrate diff --help 2>&1').toString();
    S(helpOut);
  } catch(e) {
    S('ERROR running migrate diff --help: ' + e.message);
  }
  S('');

  // 3. Physical tables in staging public schema
  S('=== 3. PHYSICAL TABLES IN STAGING ===');
  const tables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  S('Total: ' + tables.rows.length);
  tables.rows.forEach(r => S('  ' + r.table_name));
  S('');

  // 4. For each table: columns, PKs, FKs, unique constraints, indexes, checks
  S('=== 4. FULL SCHEMA DETAILS (per table) ===');
  for (const t of tables.rows) {
    const name = t.table_name;
    S('');
    S('--- TABLE: ' + name + ' ---');

    const cols = await c.query(`
      SELECT column_name, data_type, is_nullable, column_default,
             character_maximum_length, numeric_precision
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1
      ORDER BY ordinal_position
    `, [name]);
    cols.rows.forEach(r => {
      S('  COL ' + r.column_name + ' | ' + r.data_type +
        (r.character_maximum_length ? '('+r.character_maximum_length+')' : '') +
        ' | ' + (r.is_nullable==='YES'?'NULL':'NOT NULL') +
        (r.column_default ? ' | DEFAULT ' + r.column_default : ''));
    });

    const cons = await c.query(`
      SELECT tc.constraint_type, tc.constraint_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema='public' AND tc.table_name=$1
      ORDER BY tc.constraint_type, tc.constraint_name, kcu.ordinal_position
    `, [name]);
    cons.rows.forEach(r => {
      S('  ' + r.constraint_type + ': ' + r.constraint_name + ' (' + r.column_name + ')');
    });

    const idx = await c.query(`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename=$1`, [name]);
    idx.rows.forEach(r => S('  INDEX ' + r.indexname + ': ' + r.indexdef));
  }
  S('');

  // 5. Product.imageUrl — does the column still exist?
  S('=== 5. PRODUCT.IMAGEURL COLUMN CHECK ===');
  const imgCol = await c.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Product' AND column_name='imageUrl'
  `);
  if (imgCol.rows.length === 0) {
    S('Product.imageUrl: DOES NOT EXIST in physical database');
  } else {
    S('Product.imageUrl: EXISTS (' + imgCol.rows[0].data_type + ')');
    const imgCount = await c.query(`SELECT COUNT(*)::int AS n FROM "Product" WHERE "imageUrl" IS NOT NULL AND "imageUrl" != ''`);
    S('  Rows with non-null imageUrl: ' + imgCount.rows[0].n);
    const sample = await c.query(`SELECT id, "imageUrl" FROM "Product" WHERE "imageUrl" IS NOT NULL LIMIT 5`);
    sample.rows.forEach(r => S('  Sample: ' + r.id + ' -> ' + r.imageUrl));
  }
  S('');

  // 6. ProductImage row count
  S('=== 6. PRODUCTIMAGE ROW COUNT ===');
  const piCount = await c.query(`SELECT COUNT(*)::int AS n FROM "ProductImage"`);
  S('ProductImage rows: ' + piCount.rows[0].n);
  S('');

  // 7. Payment table constraints (management requirement D)
  S('=== 7. PAYMENT TABLE CONSTRAINTS ===');
  const pmtCons = await c.query(`
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = '"Payment"'::regclass
    ORDER BY conname
  `);
  pmtCons.rows.forEach(r => S('  ' + r.conname + ': ' + r.def));
  const pmtIdx = await c.query(`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='Payment'`);
  pmtIdx.rows.forEach(r => S('  INDEX ' + r.indexname + ': ' + r.indexdef));
  S('');

  // 8. RoleType enum values (Management requirement A)
  S('=== 8. ROLE TYPE ENUM VALUES ===');
  const roles = await c.query(`
    SELECT enumlabel FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname='RoleType')
    ORDER BY enumsortorder
  `);
  roles.rows.forEach(r => S('  ' + r.enumlabel));
  S('');

  // 9. Custom functions + triggers inventory
  S('=== 9. TRIGGERS + FUNCTIONS ===');
  const trig = await c.query(`
    SELECT c.relname AS tbl, t.tgname AS trg, p.proname AS fn,
           pg_get_triggerdef(t.oid) AS def
    FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_proc p ON p.oid=t.tgfoid
    WHERE n.nspname='public' AND NOT t.tgisinternal
    ORDER BY c.relname, t.tgname
  `);
  S('Total triggers: ' + trig.rows.length);
  trig.rows.forEach(r => {
    S('  ' + r.tbl + ' | ' + r.trg + ' | fn=' + r.fn);
    S('    ' + r.def);
  });
  const fns = await c.query(`
    SELECT p.proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prokind = 'f'
    ORDER BY p.proname
  `);
  S('');
  S('Custom functions: ' + fns.rows.length);
  fns.rows.forEach(r => S('  ' + r.proname));
  S('');

  // 10. Migration history table
  S('=== 10. _prisma_migrations TABLE ===');
  try {
    const migr = await c.query(`SELECT migration_name, finished_at, applied_steps_count FROM "_prisma_migrations" ORDER BY started_at`);
    S('Applied migrations: ' + migr.rows.length);
    migr.rows.forEach(r => S('  ' + r.migration_name + ' | steps=' + r.applied_steps_count + ' | finished=' + r.finished_at));
  } catch(e) {
    S('Could not read _prisma_migrations: ' + e.message);
  }
  S('');

  // 11. Migration files on disk
  S('=== 11. MIGRATION FILES ON DISK ===');
  const migDir = fs.readdirSync('prisma/migrations').filter(f =>
    fs.statSync('prisma/migrations/' + f).isDirectory()
  );
  S('Migration directories: ' + migDir.length);
  migDir.forEach(f => S('  ' + f));
  S('');

  // 12. Table creation source investigation
  S('=== 12. RECONCILIATION MATRIX (auto-generated) ===');
  S('(Format: Prisma model | exists in staging | created by migration?)');
  S('');
  // Read schema.prisma for model list
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map(m => m[1]);
  S('Prisma models: ' + models.length);
  // Read all migration files for CREATE TABLE
  const createdByMig = new Set();
  for (const d of migDir) {
    const sqlPath = 'prisma/migrations/' + d + '/migration.sql';
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      const matches = [...sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"(\w+)"/gi)];
      matches.forEach(m => createdByMig.add(m[1]));
    }
  }
  S('Tables created by migrations: ' + createdByMig.size);
  S('');
  S('MODEL | IN_STAGING | IN_MIGRATION | SOURCE');
  S('------|------------|--------------|-------');
  const stagingSet = new Set(tables.rows.map(r => r.table_name));
  for (const model of models) {
    // LegacyPayment maps to "Payment"
    const physical = model === 'LegacyPayment' ? 'Payment' : model;
    const inStaging = stagingSet.has(physical) ? 'YES' : 'NO';
    const inMigration = createdByMig.has(physical) ? 'YES' : 'NO';
    let source = 'UNKNOWN';
    if (inStaging === 'YES' && inMigration === 'YES') source = 'MIGRATION';
    else if (inStaging === 'YES' && inMigration === 'NO') source = 'UNKNOWN - NOT FROM MIGRATION';
    else if (inStaging === 'NO' && inMigration === 'YES') source = 'MIGRATION (not in DB)';
    else source = 'MISSING IN BOTH';
    S(model + ' | ' + inStaging + ' | ' + inMigration + ' | ' + source);
  }
  S('');

  S('=============================================================');
  S('END OF V4-A DIAGNOSTIC EVIDENCE');
  S('=============================================================');

  fs.writeFileSync('v4-a-diagnostics.txt', out.join('\n'), 'utf8');
  console.log('Wrote v4-a-diagnostics.txt (' + out.length + ' lines)');
  await c.end();
}

main().catch(e => {
  console.error('FATAL:', e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});