const { Client } = require('pg');
const fs = require('fs');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const trig = await c.query(`
    SELECT c.relname AS table_name, t.tgname AS trigger_name,
           p.proname AS function_name,
           pg_get_triggerdef(t.oid) AS trigger_def,
           pg_get_functiondef(p.oid) AS function_def
    FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_proc p ON p.oid=t.tgfoid
    WHERE n.nspname='public' AND NOT t.tgisinternal
    ORDER BY c.relname, t.tgname
  `);
  let out = '=== TRIGGER INVENTORY (pg_trigger + pg_proc) ===\n';
  out += 'Captured: ' + new Date().toISOString() + '\n';
  out += 'Total distinct triggers: ' + trig.rows.length + '\n\n';
  for (const r of trig.rows) {
    out += '--- ' + r.table_name + '.' + r.trigger_name + ' ---\n';
    out += 'Function: ' + r.function_name + '\n';
    out += 'Trigger definition:\n' + r.trigger_def + '\n';
    out += 'Function definition:\n' + r.function_def + '\n\n';
  }
  fs.writeFileSync('trigger-inventory.txt', out);
  console.log('Wrote trigger-inventory.txt (' + trig.rows.length + ' triggers, WITH function bodies)');
  await c.end();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });