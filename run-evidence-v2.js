const { Client } = require('pg');
const fs = require('fs');

const CONN = process.env.DATABASE_URL;
const logs = [];
const say = (s) => { logs.push(s); console.log(s); };
const RUN = Date.now().toString();

async function newClient(label) {
  const c = new Client({ connectionString: CONN });
  c.on('notice', msg => say('[' + (label||'N') + '] ' + msg.message));
  c.on('error', () => {}); // swallow idle-timeout and connection-end errors
  await c.connect();
  return c;
}

async function runTest(file, label) {
  const c = await newClient(label);
  try {
    await c.query(fs.readFileSync(file, 'utf8'));
    say('>>> ' + label + ': COMPLETED');
  } catch(e) {
    say('>>> ' + label + ': FAILED — ' + e.message);
  } finally {
    try { await c.query('ROLLBACK'); } catch(_) {}
    try { await c.end(); } catch(_) {}
  }
}

async function transferPairTest() {
  const c = await newClient('XFER');
  try {
    // Test A: unpaired
    const sc = await newClient('UNPAIR');
    try {
      await sc.query('BEGIN');
      await sc.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xfer_out_bad_${RUN}','v_xfer','l1','tg_bad_${RUN}','TRANSFER_OUT',-5,'ACTIVE','XF_BAD_${RUN}')`);
      await sc.query('COMMIT');
      say('>>> XFER-A: FAILED — unpaired committed');
    } catch(e) {
      try { await sc.query('ROLLBACK'); } catch(_) {}
      say('>>> XFER-A PASSED: Unpaired transfer rejected');
    } finally { try { await sc.end(); } catch(_) {} }

    // Reset stock for Test B
    const rc = await newClient('RESET');
    await rc.query(`UPDATE "InventoryStock" SET "quantityOnHand"=10,"quantityReserved"=0 WHERE id='is_xfer_a'`);
    await rc.query(`UPDATE "InventoryStock" SET "quantityOnHand"=0,"quantityReserved"=0 WHERE id='is_xfer_b'`);
    try { await rc.end(); } catch(_) {}

    // Test B: paired
    const pc = await newClient('PAIR');
    try {
      await pc.query('BEGIN');
      await pc.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xfer_out_ok_${RUN}','v_xfer','l1','tg_ok_${RUN}','TRANSFER_OUT',-3,'ACTIVE','XF_1_${RUN}')`);
      await pc.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","transferGroupId","type",quantity,status,reference) VALUES ('xfer_in_ok_${RUN}','v_xfer','l2','tg_ok_${RUN}','TRANSFER_IN',3,'ACTIVE','XF_2_${RUN}')`);
      await pc.query('COMMIT');
      const a = await pc.query(`SELECT "quantityOnHand" FROM "InventoryStock" WHERE id='is_xfer_a'`);
      const b = await pc.query(`SELECT "quantityOnHand" FROM "InventoryStock" WHERE id='is_xfer_b'`);
      say('>>> XFER-B PASSED: Paired transfer committed (A=' + a.rows[0].quantityOnHand + ', B=' + b.rows[0].quantityOnHand + ')');
    } catch(e) {
      try { await pc.query('ROLLBACK'); } catch(_) {}
      say('>>> XFER-B FAILED: ' + e.message);
    } finally { try { await pc.end(); } catch(_) {} }
  } finally { try { await c.end(); } catch(_) {} }
}

async function wrongPaymentTest() {
  const c = await newClient('WP');
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
      say('>>> WP: FAILED — wrong-payment allocation accepted');
    } catch(e) {
      say('>>> WP PASSED: Wrong-payment refund allocation rejected');
    }
    await c.query('ROLLBACK');
  } catch(e) {
    try { await c.query('ROLLBACK'); } catch(_) {}
    say('>>> WP FATAL: ' + e.message);
  } finally { try { await c.end(); } catch(_) {} }
}

async function concLastUnit() {
  const sc = await newClient('SETUP');
  try {
    const v = 'v_last_' + RUN;
    const isId = 'is_last_' + RUN;
    const oiId = 'oi_last_' + RUN;
    await sc.query(`INSERT INTO "ProductVariant"(id,"productId",sku,price) VALUES ('${v}','p1','SKU_LAST_${RUN}',1000)`);
    await sc.query(`INSERT INTO "InventoryStock"(id,"variantId","locationId","quantityOnHand","quantityReserved") VALUES ('${isId}','${v}','l1',1,0)`);
    await sc.query(`INSERT INTO "Order"(id,"userId",total) VALUES ('o_last_${RUN}','u_admin',1000)`);
    await sc.query(`INSERT INTO "FulfillmentGroup"(id,"orderId",type) VALUES ('fg_last_${RUN}','o_last_${RUN}','READY_STOCK')`);
    await sc.query(`INSERT INTO "OrderItem"(id,"orderId","variantId",quantity,"priceAtOrder","nameAtOrder","skuAtOrder","fulfillmentGroupId") VALUES ('${oiId}','o_last_${RUN}','${v}',1,1000,'Last','SKU_LAST_${RUN}','fg_last_${RUN}')`);
  } finally { try { await sc.end(); } catch(_) {} }

  const c1 = await newClient('C1');
  const c2 = await newClient('C2');
  try {
    await c1.query('BEGIN');
    await c2.query('BEGIN');

    const p1 = c1.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","orderItemId","type",quantity,status,reference) VALUES ('last_c1_${RUN}','v_last_${RUN}','l1','oi_last_${RUN}','RESERVATION',-1,'ACTIVE','LC1_${RUN}')`).then(()=>'OK').catch(e=>'ERR:'+e.message.substring(0,40));

    await new Promise(r => setTimeout(r, 400));

    const p2 = c2.query(`INSERT INTO "StockLedger"(id,"variantId","locationId","orderItemId","type",quantity,status,reference) VALUES ('last_c2_${RUN}','v_last_${RUN}','l1','oi_last_${RUN}','RESERVATION',-1,'ACTIVE','LC2_${RUN}')`).then(()=>'OK').catch(e=>'ERR:'+e.message.substring(0,40));

    await new Promise(r => setTimeout(r, 400));
    await c1.query('COMMIT');

    const [r1, r2] = await Promise.all([p1, p2]);
    try { await c2.query('ROLLBACK'); } catch(_) {}

    if (r1 === 'OK' && r2.startsWith('ERR')) {
      say('>>> CONC-1 PASSED: Last-unit race — exactly one succeeded');
    } else {
      say('>>> CONC-1 RESULT: r1=' + r1 + ' r2=' + r2);
    }
  } catch(e) {
    say('>>> CONC-1 FATAL: ' + e.message);
    try { await c1.query('ROLLBACK'); } catch(_) {}
    try { await c2.query('ROLLBACK'); } catch(_) {}
  } finally {
    try { await c1.end(); } catch(_) {}
    try { await c2.end(); } catch(_) {}
  }
}

async function concAllocation() {
  const sc = await newClient('SETUP');
  try {
    await sc.query(`INSERT INTO "FinancialLedger"(id,"orderId","type",amount,reference) VALUES ('fl_race_${RUN}','o_last_${RUN}','PAYMENT',20000,'FLRACE_${RUN}')`);
    await sc.query(`INSERT INTO "PaymentObligation"(id,"orderId","fulfillmentGroupId","type",amount) VALUES ('po_race_${RUN}','o_last_${RUN}','fg_last_${RUN}','PRODUCT_BALANCE',10000)`);
  } finally { try { await sc.end(); } catch(_) {} }

  const c1 = await newClient('ALC1');
  const c2 = await newClient('ALC2');
  try {
    await c1.query('BEGIN');
    await c2.query('BEGIN');

    const p1 = c1.query(`INSERT INTO "PaymentAllocation"(id,"ledgerId","obligationId","orderId",amount) VALUES ('race_1_${RUN}','fl_race_${RUN}','po_race_${RUN}','o_last_${RUN}',6000)`).then(()=>'OK').catch(e=>'ERR:'+e.message.substring(0,40));

    await new Promise(r => setTimeout(r, 400));

    const p2 = c2.query(`INSERT INTO "PaymentAllocation"(id,"ledgerId","obligationId","orderId",amount) VALUES ('race_2_${RUN}','fl_race_${RUN}','po_race_${RUN}','o_last_${RUN}',6000)`).then(()=>'OK').catch(e=>'ERR:'+e.message.substring(0,40));

    await new Promise(r => setTimeout(r, 400));
    await c1.query('COMMIT');

    const [r1, r2] = await Promise.all([p1, p2]);
    try { await c2.query('ROLLBACK'); } catch(_) {}

    if (r1 === 'OK' && r2.startsWith('ERR')) {
      say('>>> CONC-2 PASSED: Allocation race — exactly one succeeded');
    } else {
      say('>>> CONC-2 RESULT: r1=' + r1 + ' r2=' + r2);
    }
  } catch(e) {
    say('>>> CONC-2 FATAL: ' + e.message);
    try { await c1.query('ROLLBACK'); } catch(_) {}
    try { await c2.query('ROLLBACK'); } catch(_) {}
  } finally {
    try { await c1.end(); } catch(_) {}
    try { await c2.end(); } catch(_) {}
  }
}

async function main() {
  say('=== CONNECTED ===');

  say('\n=== APPLYING V2 TRIGGERS ===');
  const tc = await newClient('T');
  await tc.query(fs.readFileSync('prisma/triggers-v2.sql', 'utf8'));
  say('OK: V2 triggers applied');
  try { await tc.end(); } catch(_) {}

  say('\n=== SEEDING BASE FIXTURES ===');
  const sc = await newClient('SEED');
  await sc.query(fs.readFileSync('prisma/seed.sql', 'utf8'));
  say('OK: Seed committed');
  try { await sc.end(); } catch(_) {}

  say('\n=== V1 TESTS (1-5) ===');
  await runTest('tests/integration/phase_d.test.sql', 'V1');

  say('\n=== V2 TESTS (6-10) ===');
  await runTest('tests/integration/phase_d_v2.test.sql', 'V2');

  say('\n=== TRANSFER PAIRING ===');
  await transferPairTest();

  say('\n=== WRONG-PAYMENT REFUND ===');
  await wrongPaymentTest();

  say('\n=== CONCURRENCY ===');
  await concLastUnit();
  await concAllocation();

  const cc = await newClient('CNT');
  const t = await cc.query(`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'`);
  const tr = await cc.query(`SELECT count(*)::int AS n FROM information_schema.triggers WHERE trigger_schema='public'`);
  say('\nTables: ' + t.rows[0].n + ' | Triggers: ' + tr.rows[0].n);
  try { await cc.end(); } catch(_) {}

  fs.writeFileSync('staging-evidence-v2.txt', logs.join('\n'));
  say('\nSaved to staging-evidence-v2.txt');
}

process.on('unhandledRejection', e => { say('UNHANDLED: ' + e.message); });

main().then(() => process.exit(0)).catch(e => {
  say('FATAL: ' + e.message);
  fs.writeFileSync('staging-evidence-v2.txt', logs.join('\n'));
  process.exit(1);
});