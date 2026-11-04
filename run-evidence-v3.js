const { Client } = require('pg');
const fs = require('fs');
const { execSync } = require('child_process');

const CONN = process.env.DATABASE_URL;
if (!CONN) { console.error('DATABASE_URL required'); process.exit(1); }

const logs = [];
let failed = 0;
let passed = 0;
const say = (s) => { logs.push(s); console.log(s); };
const RUN = Date.now().toString();

async function newClient(label) {
  const c = new Client({ connectionString: CONN });
  c.on('notice', msg => {
    if (msg.message.includes('no transaction in progress')) return;
    if (msg.message.includes('does not exist, skipping')) return;
    say('[' + (label||'N') + '] ' + msg.message);
    if (msg.message.includes('PASSED')) passed++;
    if (msg.message.includes('FAILED')) failed++;
  });
  c.on('error', () => {});
  await c.connect();
  return c;
}

async function runTest(file, label) {
  const c = await newClient(label);
  try {
    const content = fs.readFileSync(file, 'utf8').replace(/\{RUN\}/g, RUN);
    await c.query(content);
    say('>>> ' + label + ': COMPLETED');
  } catch(e) {
    say('>>> ' + label + ': FAILED - ' + e.message);
    failed++;
  } finally { try { await c.end(); } catch(_) {} }
}

async function transferPairTest() {
  // A: unpaired
  const ac = await newClient('XFER-A');
  let aFailed = false, aErr = '';
  try {
    await ac.query('BEGIN');
    await ac.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xb_${RUN}','v_xfer','l1','tg_bad_${RUN}','TRANSFER_OUT',-5,'ACTIVE','XB_${RUN}')`);
    await ac.query('COMMIT');
  } catch(e) {
    aFailed = true; aErr = e.message;
    try { await ac.query('ROLLBACK'); } catch(_) {}
  } finally { try { await ac.end(); } catch(_) {} }
  if (aFailed && aErr.includes('must have exactly one')) {
    say('>>> XFER-A PASSED: Unpaired transfer rejected'); passed++;
  } else {
    say('>>> XFER-A FAILED: ' + (aFailed ? 'wrong: '+aErr.substring(0,80) : 'unpaired succeeded')); failed++;
  }

  // Reset
  const rc = await newClient('RESET');
  await rc.query(`UPDATE "InventoryStock" SET "quantityOnHand"=10,"quantityReserved"=0 WHERE id='is_xfer_a'`);
  await rc.query(`UPDATE "InventoryStock" SET "quantityOnHand"=0,"quantityReserved"=0 WHERE id='is_xfer_b'`);
  try { await rc.end(); } catch(_) {}

  // B: paired
  const pc = await newClient('XFER-B');
  let bFailed = false, bErr = '';
  try {
    await pc.query('BEGIN');
    await pc.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xo_${RUN}','v_xfer','l1','tg_ok_${RUN}','TRANSFER_OUT',-3,'ACTIVE','XO_${RUN}')`);
    await pc.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xi_${RUN}','v_xfer','l2','tg_ok_${RUN}','TRANSFER_IN',3,'ACTIVE','XI_${RUN}')`);
    await pc.query('COMMIT');
  } catch(e) {
    bFailed = true; bErr = e.message;
    try { await pc.query('ROLLBACK'); } catch(_) {}
  }
  const a = bFailed ? {rows:[{quantityOnHand:0}]} : await pc.query(`SELECT "quantityOnHand" FROM "InventoryStock" WHERE id='is_xfer_a'`);
  const b = bFailed ? {rows:[{quantityOnHand:0}]} : await pc.query(`SELECT "quantityOnHand" FROM "InventoryStock" WHERE id='is_xfer_b'`);
  try { await pc.end(); } catch(_) {}
  if (!bFailed && a.rows[0].quantityOnHand === 7 && b.rows[0].quantityOnHand === 3) {
    say('>>> XFER-B PASSED: Paired transfer committed (A=7, B=3)'); passed++;
  } else {
    say('>>> XFER-B FAILED: ' + (bFailed ? bErr.substring(0,80) : 'stock mismatch')); failed++;
  }

  // C: mismatched variant
  const mc = await newClient('XFER-C');
  let cFailed = false, cErr = '';
  try {
    await mc.query('BEGIN');
    await mc.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xm1_${RUN}','v_xfer','l1','tg_bad2_${RUN}','TRANSFER_OUT',-3,'ACTIVE','XM1_${RUN}')`);
    await mc.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xm2_${RUN}','v1','l2','tg_bad2_${RUN}','TRANSFER_IN',3,'ACTIVE','XM2_${RUN}')`);
    await mc.query('COMMIT');
  } catch(e) {
    cFailed = true; cErr = e.message;
    try { await mc.query('ROLLBACK'); } catch(_) {}
  } finally { try { await mc.end(); } catch(_) {} }
  if (cFailed && cErr.includes('variant mismatch')) {
    say('>>> XFER-C PASSED: Mismatched variant rejected'); passed++;
  } else {
    say('>>> XFER-C FAILED: ' + (cFailed ? 'wrong: '+cErr.substring(0,80) : 'mismatched succeeded')); failed++;
  }

  // D: duplicate TRANSFER_OUT (exact-count enforcement)
  const dc = await newClient('XFER-D');
  let dFailed = false, dErr = '';
  try {
    await dc.query('BEGIN');
    await dc.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xd1_${RUN}','v_xfer','l1','tg_dup_${RUN}','TRANSFER_OUT',-2,'ACTIVE','XD1_${RUN}')`);
    await dc.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xd2_${RUN}','v_xfer','l1','tg_dup_${RUN}','TRANSFER_OUT',-2,'ACTIVE','XD2_${RUN}')`);
    await dc.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xd3_${RUN}','v_xfer','l2','tg_dup_${RUN}','TRANSFER_IN',2,'ACTIVE','XD3_${RUN}')`);
    await dc.query('COMMIT');
  } catch(e) {
    dFailed = true; dErr = e.message;
    try { await dc.query('ROLLBACK'); } catch(_) {}
  } finally { try { await dc.end(); } catch(_) {} }
  if (dFailed && dErr.includes('exactly one OUT')) {
    say('>>> XFER-D PASSED: Duplicate TRANSFER_OUT rejected'); passed++;
  } else {
    say('>>> XFER-D FAILED: ' + (dFailed ? 'wrong: '+dErr.substring(0,80) : 'duplicate out succeeded')); failed++;
  }
}

async function wrongPaymentTest() {
  const c = await newClient('WP');
  let wpFailed = false, wpErr = '', opRejected = false, opErr = '';
  try {
    await c.query('BEGIN');
    await c.query(`INSERT INTO "Order"(id,"userId",total) VALUES ('o_wp_${RUN}','u_admin',20000)`);
    await c.query(`INSERT INTO "FulfillmentGroup"(id,"orderId",type) VALUES ('fg_wp_${RUN}','o_wp_${RUN}','READY_STOCK')`);
    await c.query(`INSERT INTO "FinancialLedger"(id,"orderId","type",amount,reference) VALUES ('fl_wpa_${RUN}','o_wp_${RUN}','PAYMENT',10000,'FLWPA_${RUN}')`);
    await c.query(`INSERT INTO "FinancialLedger"(id,"orderId","type",amount,reference) VALUES ('fl_wpb_${RUN}','o_wp_${RUN}','PAYMENT',10000,'FLWPB_${RUN}')`);
    await c.query(`INSERT INTO "PaymentObligation"(id,"orderId","fulfillmentGroupId","type",amount) VALUES ('po_wpa_${RUN}','o_wp_${RUN}','fg_wp_${RUN}','PRODUCT_BALANCE',10000)`);
    await c.query(`INSERT INTO "PaymentObligation"(id,"orderId","fulfillmentGroupId","type",amount) VALUES ('po_wpb_${RUN}','o_wp_${RUN}','fg_wp_${RUN}','DELIVERY_CHARGE',10000)`);
    await c.query(`INSERT INTO "PaymentAllocation"(id,"ledgerId","obligationId","orderId",amount) VALUES ('pa_wpa_${RUN}','fl_wpa_${RUN}','po_wpa_${RUN}','o_wp_${RUN}',10000)`);
    await c.query(`INSERT INTO "PaymentAllocation"(id,"ledgerId","obligationId","orderId",amount) VALUES ('pa_wpb_${RUN}','fl_wpb_${RUN}','po_wpb_${RUN}','o_wp_${RUN}',10000)`);
    await c.query(`INSERT INTO "RefundRequest"(id,"originalLedgerId",amount,reason,status) VALUES ('rr_wp_${RUN}','fl_wpa_${RUN}',5000,'test','APPROVED')`);
    await c.query(`INSERT INTO "FinancialLedger"(id,"orderId","type",amount,reference) VALUES ('fl_wpr_${RUN}','o_wp_${RUN}','REFUND',-5000,'FLWPR_${RUN}')`);
    try {
      await c.query(`INSERT INTO "RefundAllocation"(id,"refundRequestId","originalLedgerId","originalAllocationId",amount) VALUES ('ra_wp_${RUN}','rr_wp_${RUN}','fl_wpa_${RUN}','pa_wpb_${RUN}',5000)`);
    } catch(e) { opRejected = true; opErr = e.message; }
    await c.query('ROLLBACK');
  } catch(e) {
    wpFailed = true; wpErr = e.message;
    try { await c.query('ROLLBACK'); } catch(_) {}
  } finally { try { await c.end(); } catch(_) {} }
  if (wpFailed) { say('>>> WP FATAL: ' + wpErr); failed++; return; }
  if (opRejected && opErr.includes('violates foreign key')) {
    say('>>> WP PASSED: Wrong-payment refund allocation rejected'); passed++;
  } else {
    say('>>> WP FAILED: ' + (opRejected ? 'wrong: '+opErr.substring(0,80) : 'succeeded unexpectedly')); failed++;
  }
}

async function concLastUnit() {
  const sc = await newClient('SETUP-C1');
  try {
    await sc.query(`INSERT INTO "ProductVariant"(id,"productId",sku,price) VALUES ('v_last_${RUN}','p1','SKU_LAST_${RUN}',1000)`);
    await sc.query(`INSERT INTO "InventoryStock"(id,"variantId","locationId","quantityOnHand","quantityReserved") VALUES ('is_last_${RUN}','v_last_${RUN}','l1',1,0)`);
    await sc.query(`INSERT INTO "Order"(id,"userId",total) VALUES ('o_last_${RUN}','u_admin',1000)`);
    await sc.query(`INSERT INTO "FulfillmentGroup"(id,"orderId",type) VALUES ('fg_last_${RUN}','o_last_${RUN}','READY_STOCK')`);
    await sc.query(`INSERT INTO "OrderItem"(id,"orderId","variantId",quantity,"priceAtOrder","nameAtOrder","skuAtOrder","fulfillmentGroupId") VALUES ('oi_last_${RUN}','o_last_${RUN}','v_last_${RUN}',1,1000,'L','SKU_LAST_${RUN}','fg_last_${RUN}')`);
  } finally { try { await sc.end(); } catch(_) {} }
  const c1 = await newClient('C1');
  const c2 = await newClient('C2');
  let r1 = '', r2 = '';
  try {
    await c1.query('BEGIN'); await c2.query('BEGIN');
    const p1 = c1.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","orderItemId","type",quantity,status,reference) VALUES ('lc1_${RUN}','v_last_${RUN}','l1','oi_last_${RUN}','RESERVATION',-1,'ACTIVE','LC1_${RUN}')`).then(()=>'OK').catch(e=>'ERR:'+e.message);
    await new Promise(r => setTimeout(r, 400));
    const p2 = c2.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","orderItemId","type",quantity,status,reference) VALUES ('lc2_${RUN}','v_last_${RUN}','l1','oi_last_${RUN}','RESERVATION',-1,'ACTIVE','LC2_${RUN}')`).then(()=>'OK').catch(e=>'ERR:'+e.message);
    await new Promise(r => setTimeout(r, 400));
    await c1.query('COMMIT');
    [r1, r2] = await Promise.all([p1, p2]);
    try { await c2.query('ROLLBACK'); } catch(_) {}
  } catch(e) {
    try { await c1.query('ROLLBACK'); } catch(_) {}
    try { await c2.query('ROLLBACK'); } catch(_) {}
  } finally { try { await c1.end(); } catch(_) {} try { await c2.end(); } catch(_) {} }
  if ((r1 === 'OK' && r2.startsWith('ERR')) || (r1.startsWith('ERR') && r2 === 'OK')) {
    say('>>> CONC-1 PASSED: Last-unit race - exactly one succeeded'); passed++;
  } else {
    say('>>> CONC-1 FAILED: r1=' + r1 + ' r2=' + r2); failed++;
  }
}

async function concAllocation() {
  const sc = await newClient('SETUP-C2');
  try {
    await sc.query(`INSERT INTO "FinancialLedger"(id,"orderId","type",amount,reference) VALUES ('fl_race_${RUN}','o_last_${RUN}','PAYMENT',20000,'FLRACE_${RUN}')`);
    await sc.query(`INSERT INTO "PaymentObligation"(id,"orderId","fulfillmentGroupId","type",amount) VALUES ('po_race_${RUN}','o_last_${RUN}','fg_last_${RUN}','PRODUCT_BALANCE',10000)`);
  } finally { try { await sc.end(); } catch(_) {} }
  const c1 = await newClient('ALC1');
  const c2 = await newClient('ALC2');
  let r1 = '', r2 = '';
  try {
    await c1.query('BEGIN'); await c2.query('BEGIN');
    const p1 = c1.query(`INSERT INTO "PaymentAllocation"(id,"ledgerId","obligationId","orderId",amount) VALUES ('rc1_${RUN}','fl_race_${RUN}','po_race_${RUN}','o_last_${RUN}',6000)`).then(()=>'OK').catch(e=>'ERR:'+e.message);
    await new Promise(r => setTimeout(r, 400));
    const p2 = c2.query(`INSERT INTO "PaymentAllocation"(id,"ledgerId","obligationId","orderId",amount) VALUES ('rc2_${RUN}','fl_race_${RUN}','po_race_${RUN}','o_last_${RUN}',6000)`).then(()=>'OK').catch(e=>'ERR:'+e.message);
    await new Promise(r => setTimeout(r, 400));
    await c1.query('COMMIT');
    [r1, r2] = await Promise.all([p1, p2]);
    try { await c2.query('ROLLBACK'); } catch(_) {}
  } catch(e) {
    try { await c1.query('ROLLBACK'); } catch(_) {}
    try { await c2.query('ROLLBACK'); } catch(_) {}
  } finally { try { await c1.end(); } catch(_) {} try { await c2.end(); } catch(_) {} }
  if ((r1 === 'OK' && r2.startsWith('ERR')) || (r1.startsWith('ERR') && r2 === 'OK')) {
    say('>>> CONC-2 PASSED: Allocation race - exactly one succeeded'); passed++;
  } else {
    say('>>> CONC-2 FAILED: r1=' + r1 + ' r2=' + r2); failed++;
  }
}

async function main() {
  const c = await newClient('ENV');
  const pgVer = await c.query('SHOW server_version');
  const dbName = await c.query('SELECT current_database() AS n');
  say('=== ENVIRONMENT ===');
  say('PostgreSQL: ' + pgVer.rows[0].server_version);
  say('Database: ' + dbName.rows[0].n);
  try { say('Git commit: ' + execSync('git rev-parse HEAD').toString().trim()); } catch(_) { say('Git commit: unavailable'); }
  say('Node.js: ' + process.version);
  try { await c.end(); } catch(_) {}

  say('\n=== TRIGGERS FROM pg_trigger CATALOG ===');
  const cat = await newClient('CAT');
  const trigInfo = await cat.query(`SELECT t.tgname AS trigger_name, c.relname AS table_name, pg_get_triggerdef(t.oid) AS def FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY c.relname, t.tgname`);
  say('Total distinct triggers (pg_trigger): ' + trigInfo.rows.length);
  trigInfo.rows.forEach(r => say('  ' + r.table_name + ' | ' + r.trigger_name));
  try { await cat.end(); } catch(_) {}

  say('\n=== SEEDING BASE FIXTURES ===');
  const sc = await newClient('SEED');
  await sc.query(fs.readFileSync('prisma/seed.sql', 'utf8'));
  say('OK: Seed committed');
  try { await sc.end(); } catch(_) {}

  say('\n=== V1 TESTS ===');
  await runTest('tests/integration/phase_d.test.sql', 'V1');

  say('\n=== V2 TESTS ===');
  await runTest('tests/integration/phase_d_v2.test.sql', 'V2');

  say('\n=== TRANSFER PAIRING ===');
  await transferPairTest();

  say('\n=== WRONG-PAYMENT REFUND ===');
  await wrongPaymentTest();

  say('\n=== CONCURRENCY ===');
  await concLastUnit();
  await concAllocation();

  const cc = await newClient('FINAL');
  const t = await cc.query(`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'`);
  say('\n=== FINAL STATS ===');
  say('Tables: ' + t.rows[0].n + ' | Distinct triggers (pg_trigger): ' + trigInfo.rows.length);
  try { await cc.end(); } catch(_) {}

  say('\n=== SUMMARY ===');
  say('Passed: ' + passed);
  say('Failed: ' + failed);
  say('Exit code: ' + (failed > 0 ? 1 : 0));

  fs.writeFileSync('staging-evidence-v3.txt', logs.join('\n'));
  say('\nSaved to staging-evidence-v3.txt');
}

process.on('unhandledRejection', e => { say('UNHANDLED: ' + e.message); failed++; });

main().then(() => process.exit(failed > 0 ? 1 : 0))
  .catch(e => {
    say('FATAL: ' + e.message);
    fs.writeFileSync('staging-evidence-v3.txt', logs.join('\n'));
    process.exit(1);
  });