const { Client } = require('pg');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  let out = '=== SCHEMA EXPORT ===\n';
  out += 'Captured: ' + new Date().toISOString() + '\n\n';

  // Tables + columns — FIXED to_regclass (Finding C)
  const tables = await c.query(`
    SELECT c.oid, c.relname AS table_name
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'
    ORDER BY c.relname
  `);
  out += '## TABLES AND COLUMNS (' + tables.rows.length + ')\n\n';
  for (const t of tables.rows) {
    out += '### ' + t.table_name + '\n';
    // FIXED: pass OID directly (no string casting)
    const cols = await c.query(`
      SELECT a.attname AS col, format_type(a.atttypid, a.atttypmod) AS type,
             NOT a.attnotnull AS nullable,
             pg_get_expr(d.adbin, d.adrelid) AS default_val
      FROM pg_attribute a
      LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
      WHERE a.attrelid = $1::oid AND a.attnum>0 AND NOT a.attisdropped
      ORDER BY a.attnum
    `, [t.oid]);
    for (const col of cols.rows) {
      out += '  ' + col.col + ' : ' + col.type + (col.nullable ? '' : ' NOT NULL') + (col.default_val ? ' DEFAULT ' + col.default_val : '') + '\n';
    }
    out += '\n';
  }

  // Primary keys
  const pks = await c.query(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
    WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema='public' ORDER BY tc.table_name, kcu.ordinal_position
  `);
  out += '## PRIMARY KEYS\n\n';
  const pkByTable = {};
  for (const r of pks.rows) { if (!pkByTable[r.table_name]) pkByTable[r.table_name] = { name: r.constraint_name, cols: [] }; pkByTable[r.table_name].cols.push(r.column_name); }
  for (const [tbl, pk] of Object.entries(pkByTable)) out += '  ' + tbl + ' : ' + pk.name + ' (' + pk.cols.join(', ') + ')\n';
  out += '\n';

  // Foreign keys
  const fks = await c.query(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema
    WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public' ORDER BY tc.table_name, tc.constraint_name
  `);
  out += '## FOREIGN KEYS (' + fks.rows.length + ')\n\n';
  for (const r of fks.rows) out += '  ' + r.table_name + '.' + r.column_name + ' -> ' + r.foreign_table + '.' + r.foreign_column + ' [' + r.constraint_name + ']\n';
  out += '\n';

  // Unique constraints
  const uniques = await c.query(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
    WHERE tc.constraint_type='UNIQUE' AND tc.table_schema='public' ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position
  `);
  out += '## UNIQUE CONSTRAINTS (' + uniques.rows.length + ')\n\n';
  for (const r of uniques.rows) out += '  ' + r.table_name + ' : ' + r.constraint_name + ' (' + r.column_name + ')\n';
  out += '\n';

  // Check constraints
  const checks = await c.query(`
    SELECT conrelid::regclass::text AS table_name, conname AS constraint_name, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint WHERE contype='c' AND connamespace='public'::regnamespace ORDER BY conrelid::regclass::text, conname
  `);
  out += '## CHECK CONSTRAINTS (' + checks.rows.length + ')\n\n';
  for (const r of checks.rows) out += '  ' + r.table_name + ' : ' + r.constraint_name + ' : ' + r.definition + '\n';
  out += '\n';

  // Indexes
  const indexes = await c.query(`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename, indexname`);
  out += '## INDEXES (' + indexes.rows.length + ')\n\n';
  for (const r of indexes.rows) out += '  ' + r.tablename + ' : ' + r.indexname + '\n    ' + r.indexdef + '\n';
  out += '\n';

  // Enums
  const enums = await c.query(`
    SELECT t.typname AS enum_name, e.enumlabel AS value
    FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='public' ORDER BY t.typname, e.enumsortorder
  `);
  out += '## ENUMS\n\n';
  const enumByType = {};
  for (const r of enums.rows) { if (!enumByType[r.enum_name]) enumByType[r.enum_name] = []; enumByType[r.enum_name].push(r.value); }
  for (const [name, vals] of Object.entries(enumByType)) out += '  ' + name + ' : ' + vals.join(', ') + '\n';
  out += '\n';

  fs.writeFileSync('schema-export.txt', out);
  console.log('✅ Wrote schema-export.txt (' + tables.rows.length + ' tables, ' + fks.rows.length + ' FKs, ' + indexes.rows.length + ' indexes)');
  await c.end();

  // Attempt pg_dump for complete SQL export (Finding C recommendation)
  try {
    execSync('pg_dump --version', { stdio: 'pipe' });
    execSync('pg_dump --schema-only --no-owner --no-privileges --no-comments -f schema-export-pgdump.sql "' + process.env.DATABASE_URL + '"', { stdio: 'pipe' });
    const dumpSize = fs.statSync('schema-export-pgdump.sql').size;
    console.log('✅ pg_dump available — also wrote schema-export-pgdump.sql (' + dumpSize + ' bytes)');
  } catch(e) {
    console.log('ℹ️  pg_dump not available — schema-export.txt (JSON) is the primary artifact');
  }
})().catch(e => { console.error('ERROR:', e.message); if (e.stack) console.error(e.stack); process.exit(1); });