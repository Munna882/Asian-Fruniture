const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const logs = [];
  const say = (s) => { logs.push(s); console.log(s); };
  client.on('notice', (msg) => { say('[NOTICE] ' + msg.message); });
  client.on('error', (err) => { say('[DB ERROR] ' + err.message); });

  try {
    await client.connect();
    say('=== CONNECTED TO STAGING ===');

    say('\n=== APPLYING TRIGGERS ===');
    await client.query(fs.readFileSync('prisma/triggers.sql', 'utf8'));
    say('✅ Triggers applied');

    say('\n=== RUNNING INTEGRATION TESTS ===');
    await client.query(fs.readFileSync('tests/integration/phase_d.test.sql', 'utf8'));
    say('✅ Test execution completed');

    const t = await client.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'");
    say('\nTables in DB: ' + t.rows[0].n);

    const trg = await client.query("SELECT count(*)::int AS n FROM information_schema.triggers WHERE trigger_schema='public'");
    say('Triggers installed: ' + trg.rows[0].n);

  } catch (e) {
    say('\n❌ ERROR: ' + e.message);
    if (e.detail) say('Detail: ' + e.detail);
  } finally {
    await client.end();
    fs.writeFileSync('staging-evidence.txt', logs.join('\n'));
    say('\n✅ Saved to staging-evidence.txt');
  }
}

main();