const { Client } = require('pg');
const fs = require('fs');
const { execSync } = require('child_process');

// ============ STAGING HOST VALIDATION (Finding D) ============
const CONN = process.env.DATABASE_URL;
if (!CONN) { console.error('FATAL: DATABASE_URL not set'); process.exit(1); }

const ALLOWED_HOSTS = ['ep-silent-union-bb47s2rr.c-15.us-east-1.aws.neon.tech', 'ep-silent-union-bb47s2rr-pooler.c-15.us-east-1.aws.neon.tech'];
let connHost = '';
try {
  const u = new URL(CONN.replace(/^postgresql:\/\//, 'http://'));
  connHost = u.hostname;
} catch (e) { console.error('FATAL: DATABASE_URL is not a valid URL'); process.exit(1); }

if (!ALLOWED_HOSTS.includes(connHost)) {
  console.error('FATAL: DATABASE_URL host "' + connHost + '" is not in the approved staging allowlist.');
  console.error('Approved hosts: ' + ALLOWED_HOSTS.join(', '));
  process.exit(1);
}
if (connHost.includes('prod') || connHost.includes('production')) {
  console.error('FATAL: hostname contains "prod" — refusing to run');
  process.exit(1);
}
// ============================================================

const logs = [];
let failed = 0;
let passed = 0;
const say = (s) => { logs.push(s); console.log(s); };
const RUN = Date.now().toString();

async function newClient(label) {
  const c = new Client({ connectionString: CONN });
  c.on('notice', msg => {
    say('[' + (label||'N') + '] NOTICE: ' + msg.message);
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

// Transfer tests use commitAttempted pattern
async function transferPairTest() {
  // XFER-A: unpaired rejected
  {
    const c = await newClient('XFER-A');
    let commitAttempted = false;
    let err = '';
    try {
      await c.query('BEGIN');
      await c.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xb_${RUN}','v_xfer','l1','tg_bad_${RUN}','TRANSFER_OUT',-5,'ACTIVE','XB_${RUN}')`);
      commitAttempted = true;
      await c.query('COMMIT');
    } catch(e) {
      err = e.message;
      if (!commitAttempted) { try { await c.query('ROLLBACK'); } catch(_) {} }
    } finally { try { await c.end(); } catch(_) {} }
    if (commitAttempted && err.includes('must have exactly one OUT')) { say('>>> XFER-A PASSED: Unpaired rejected at COMMIT'); passed++; }
    else if (!commitAttempted && err) { say('>>> XFER-A PASSED: Unpaired rejected before COMMIT'); passed++; }
    else { say('>>> XFER-A FAILED: ' + (err || 'no rejection')); failed++; }
  }

  // Reset stock
  {
    const c = await newClient('RESET');
    await c.query(`UPDATE "InventoryStock" SET "quantityOnHand"=10,"quantityReserved"=0 WHERE id='is_xfer_a'`);
    await c.query(`UPDATE "InventoryStock" SET "quantityOnHand"=0,"quantityReserved"=0 WHERE id='is_xfer_b'`);
    try { await c.end(); } catch(_) {}
  }

  // XFER-B: paired success
  {
    const c = await newClient('XFER-B');
    let commitAttempted = false;
    let err = '';
    try {
      await c.query('BEGIN');
      await c.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xo_${RUN}','v_xfer','l1','tg_ok_${RUN}','TRANSFER_OUT',-3,'ACTIVE','XO_${RUN}')`);
      await c.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xi_${RUN}','v_xfer','l2','tg_ok_${RUN}','TRANSFER_IN',3,'ACTIVE','XI_${RUN}')`);
      commitAttempted = true;
      await c.query('COMMIT');
    } catch(e) {
      err = e.message;
      if (!commitAttempted) { try { await c.query('ROLLBACK'); } catch(_) {} }
    }
    let a = { rows: [{ quantityOnHand: 0 }] }, b = { rows: [{ quantityOnHand: 0 }] };
    if (!err) {
      a = await c.query(`SELECT "quantityOnHand" FROM "InventoryStock" WHERE id='is_xfer_a'`);
      b = await c.query(`SELECT "quantityOnHand" FROM "InventoryStock" WHERE id='is_xfer_b'`);
    }
    try { await c.end(); } catch(_) {}
    if (!err && a.rows[0].quantityOnHand === 7 && b.rows[0].quantityOnHand === 3) { say('>>> XFER-B PASSED: Paired transfer (A=7, B=3)'); passed++; }
    else { say('>>> XFER-B FAILED: ' + (err || 'A='+a.rows[0].quantityOnHand+' B='+b.rows[0].quantityOnHand)); failed++; }
  }

  // XFER-C: mismatched variant
  {
    const c = await newClient('XFER-C');
    let commitAttempted = false;
    let err = '';
    try {
      await c.query('BEGIN');
      await c.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xm1_${RUN}','v_xfer','l1','tg_c_${RUN}','TRANSFER_OUT',-3,'ACTIVE','XM1_${RUN}')`);
      await c.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xm2_${RUN}','v1','l2','tg_c_${RUN}','TRANSFER_IN',3,'ACTIVE','XM2_${RUN}')`);
      commitAttempted = true;
      await c.query('COMMIT');
    } catch(e) {
      err = e.message;
      if (!commitAttempted) { try { await c.query('ROLLBACK'); } catch(_) {} }
    } finally { try { await c.end(); } catch(_) {} }
    if (err.includes('variant mismatch')) { say('>>> XFER-C PASSED: Mismatched variant rejected'); passed++; }
    else { say('>>> XFER-C FAILED: ' + (err || 'succeeded unexpectedly')); failed++; }
  }

  // XFER-D: duplicate OUT
  {
    const c = await newClient('XFER-D');
    let commitAttempted = false;
    let err = '';
    try {
      await c.query('BEGIN');
      await c.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xd1_${RUN}','v_xfer','l1','tg_d_${RUN}','TRANSFER_OUT',-2,'ACTIVE','XD1_${RUN}')`);
      await c.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xd2_${RUN}','v_xfer','l1','tg_d_${RUN}','TRANSFER_OUT',-2,'ACTIVE','XD2_${RUN}')`);
      await c.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xd3_${RUN}','v_xfer','l2','tg_d_${RUN}','TRANSFER_IN',2,'ACTIVE','XD3_${RUN}')`);
      commitAttempted = true;
      await c.query('COMMIT');
    } catch(e) {
      err = e.message;
      if (!commitAttempted) { try { await c.query('ROLLBACK'); } catch(_) {} }
    } finally { try { await c.end(); } catch(_) {} }
    if (err.includes('exactly one OUT')) { say('>>> XFER-D PASSED: Duplicate TRANSFER_OUT rejected'); passed++; }
    else { say('>>> XFER-D FAILED: ' + (err || 'succeeded unexpectedly')); failed++; }
  }
}

async function wrongPaymentTest() {
  const c = await newClient('WP');
  let opRejected = false, opErr = '';
  let beginAttempted = false, commitAttempted = false;
  try {
    beginAttempted = true;
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
    commitAttempted = false;
    await c.query('ROLLBACK');
  } catch(e) {
    opErr = 'setup: ' + e.message;
    if (beginAttempted && !commitAttempted) { try { await c.query('ROLLBACK'); } catch(_) {} }
  } finally { try { await c.end(); } catch(_) {} }
  if (opRejected && opErr.includes('violates foreign key')) { say('>>> WP PASSED: Wrong-payment rejected by composite FK'); passed++; }
  else { say('>>> WP FAILED: ' + (opRejected ? 'wrong: '+opErr.substring(0,100) : opErr || 'not rejected')); failed++; }
}

// ============ CONC-1 WITH STRONG ASSERTIONS (Finding E) ============
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
  let r1 = '', r1err = '', r2 = '', r2err = '';
  let c1CommitAttempted = false, c2CommitAttempted = false;
  try {
    await c1.query('BEGIN');
    await c2.query('BEGIN');
    const p1 = c1.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","orderItemId","type",quantity,status,reference) VALUES ('lc1_${RUN}','v_last_${RUN}','l1','oi_last_${RUN}','RESERVATION',-1,'ACTIVE','LC1_${RUN}')`).then(()=>'OK').catch(e=>{r1err = e.message; return 'ERR';});
    await new Promise(r => setTimeout(r, 400));
    const p2 = c2.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","orderItemId","type",quantity,status,reference) VALUES ('lc2_${RUN}','v_last_${RUN}','l1','oi_last_${RUN}','RESERVATION',-1,'ACTIVE','LC2_${RUN}')`).then(()=>'OK').catch(e=>{r2err = e.message; return 'ERR';});
    await new Promise(r => setTimeout(r, 400));

    try { c1CommitAttempted = true; await c1.query('COMMIT'); }
    catch(e) { if (!c1CommitAttempted) try { await c1.query('ROLLBACK'); } catch(_) {} }

    try { c2CommitAttempted = true; await c2.query('COMMIT'); }
    catch(e) { if (!c2CommitAttempted) try { await c2.query('ROLLBACK'); } catch(_) {} }

    [r1, r2] = await Promise.all([p1, p2]);
  } catch(e) {
    if (!c1CommitAttempted) try { await c1.query('ROLLBACK'); } catch(_) {}
    if (!c2CommitAttempted) try { await c2.query('ROLLBACK'); } catch(_) {}
  } finally { try { await c1.end(); } catch(_) {} try { await c2.end(); } catch(_) {} }

  // ============ ASSERT FINAL STATE (Finding E) ============
  const chk = await newClient('CHECK-1');
  const res = await chk.query(`SELECT COUNT(*)::int AS n FROM "StockLedger" WHERE "variantId"='v_last_${RUN}' AND "type"='RESERVATION' AND "status"='ACTIVE'`);
  const inv = await chk.query(`SELECT "quantityOnHand", "quantityReserved" FROM "InventoryStock" WHERE id='is_last_${RUN}'`);
  try { await chk.end(); } catch(_) {}

  const exactlyOne = res.rows[0].n === 1;
  const stockOk = inv.rows[0].quantityOnHand === 1 && inv.rows[0].quantityReserved === 1;
  const loserReasonOk = (r1 === 'OK' && r2 === 'ERR' && r2err.includes('Insufficient available stock')) ||
                        (r2 === 'OK' && r1 === 'ERR' && r1err.includes('Insufficient available stock'));

  if (exactlyOne && stockOk && loserReasonOk) {
    say('>>> CONC-1 PASSED: 1 reservation committed, onHand=1 reserved=1, loser rejected with "Insufficient available stock"');
    passed++;
  } else {
    say('>>> CONC-1 FAILED: r1=' + r1 + ' r2=' + r2 + ' count=' + res.rows[0].n + ' onHand=' + inv.rows[0].quantityOnHand + ' reserved=' + inv.rows[0].quantityReserved + ' r1err=' + r1err.substring(0,50) + ' r2err=' + r2err.substring(0,50));
    failed++;
  }
}

// ============ CONC-2 WITH STRONG ASSERTIONS (Finding E) ============
async function concAllocation() {
  const sc = await newClient('SETUP-C2');
  try {
    await sc.query(`INSERT INTO "FinancialLedger"(id,"orderId","type",amount,reference) VALUES ('fl_race_${RUN}','o_last_${RUN}','PAYMENT',20000,'FLRACE_${RUN}')`);
    await sc.query(`INSERT INTO "PaymentObligation"(id,"orderId","fulfillmentGroupId","type",amount) VALUES ('po_race_${RUN}','o_last_${RUN}','fg_last_${RUN}','PRODUCT_BALANCE',10000)`);
  } finally { try { await sc.end(); } catch(_) {} }

  const c1 = await newClient('ALC1');
  const c2 = await newClient('ALC2');
  let r1 = '', r1err = '', r2 = '', r2err = '';
  let c1CommitAttempted = false, c2CommitAttempted = false;
  try {
    await c1.query('BEGIN');
    await c2.query('BEGIN');
    const p1 = c1.query(`INSERT INTO "PaymentAllocation"(id,"ledgerId","obligationId","orderId",amount) VALUES ('rc1_${RUN}','fl_race_${RUN}','po_race_${RUN}','o_last_${RUN}',6000)`).then(()=>'OK').catch(e=>{r1err = e.message; return 'ERR';});
    await new Promise(r => setTimeout(r, 400));
    const p2 = c2.query(`INSERT INTO "PaymentAllocation"(id,"ledgerId","obligationId","orderId",amount) VALUES ('rc2_${RUN}','fl_race_${RUN}','po_race_${RUN}','o_last_${RUN}',6000)`).then(()=>'OK').catch(e=>{r2err = e.message; return 'ERR';});
    await new Promise(r => setTimeout(r, 400));

    try { c1CommitAttempted = true; await c1.query('COMMIT'); }
    catch(e) { if (!c1CommitAttempted) try { await c1.query('ROLLBACK'); } catch(_) {} }

    try { c2CommitAttempted = true; await c2.query('COMMIT'); }
    catch(e) { if (!c2CommitAttempted) try { await c2.query('ROLLBACK'); } catch(_) {} }

    [r1, r2] = await Promise.all([p1, p2]);
  } catch(e) {
    if (!c1CommitAttempted) try { await c1.query('ROLLBACK'); } catch(_) {}
    if (!c2CommitAttempted) try { await c2.query('ROLLBACK'); } catch(_) {}
  } finally { try { await c1.end(); } catch(_) {} try { await c2.end(); } catch(_) {} }

  // ============ ASSERT FINAL STATE (Finding E) ============
  const chk = await newClient('CHECK-2');
  const res = await chk.query(`SELECT COUNT(*)::int AS n, COALESCE(SUM(amount),0)::int AS total FROM "PaymentAllocation" WHERE "obligationId"='po_race_${RUN}'`);
  try { await chk.end(); } catch(_) {}

  const exactlyOne = res.rows[0].n === 1;
  const totalOk = res.rows[0].total <= 10000;
  const loserReasonOk = (r1 === 'OK' && r2 === 'ERR' && r2err.includes('exceeds obligation')) ||
                        (r2 === 'OK' && r1 === 'ERR' && r1err.includes('exceeds obligation'));

  if (exactlyOne && totalOk && loserReasonOk) {
    say('>>> CONC-2 PASSED: 1 allocation committed (' + res.rows[0].total + ' <= 10000), loser rejected with "exceeds obligation"');
    passed++;
  } else {
    say('>>> CONC-2 FAILED: r1=' + r1 + ' r2=' + r2 + ' count=' + res.rows[0].n + ' total=' + res.rows[0].total + ' r1err=' + r1err.substring(0,50) + ' r2err=' + r2err.substring(0,50));
    failed++;
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
  say('Host validation: APPROVED (' + connHost + ')');
  try { await c.end(); } catch(_) {}

  say('\n=== TRIGGERS ===');
  const cat = await newClient('CAT');
  const trig = await cat.query(`
    SELECT c.relname AS table_name, t.tgname AS trigger_name, p.proname AS function_name,
           pg_get_triggerdef(t.oid) AS trigger_def, pg_get_functiondef(p.oid) AS function_def
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_proc p ON p.oid=t.tgfoid
    WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY c.relname, t.tgname
  `);
  say('Total distinct triggers: ' + trig.rows.length);
  for (const r of trig.rows) say('  ' + r.table_name + ' | ' + r.trigger_name + ' | fn=' + r.function_name);
  try { await cat.end(); } catch(_) {}

  say('\n=== SEED ===');
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
  say('Tables: ' + t.rows[0].n + ' | Distinct triggers: ' + trig.rows.length);
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
  .catch(e => { say('FATAL: ' + e.message); if (e.stack) say(e.stack); fs.writeFileSync('staging-evidence-v3.txt', logs.join('\n')); process.exit(1); });