SET plpgsql.check_asserts = true;
BEGIN;

-- Reset raw material stock to known value
UPDATE "RawMaterialStock" SET "quantityOnHand"=100 WHERE id='rms_v2';

-- Per-run fixtures
INSERT INTO "Order"(id,"userId",total) VALUES ('o_v2_{RUN}','u_admin',50000);
INSERT INTO "FulfillmentGroup"(id,"orderId",type) VALUES ('fg_v2_{RUN}','o_v2_{RUN}','MADE_TO_ORDER');
INSERT INTO "OrderItem"(id,"orderId","variantId",quantity,"priceAtOrder","nameAtOrder","skuAtOrder","fulfillmentGroupId") VALUES ('oi_v2_{RUN}','o_v2_{RUN}','v1',1,50000,'Bed','SKU_BED','fg_v2_{RUN}');
INSERT INTO "ProductionJob"(id,"orderItemId",status,"bomSnapshot") VALUES ('pj_v2_{RUN}','oi_v2_{RUN}','PENDING','{"wood":5}');

DO $$
DECLARE op_failed BOOLEAN := FALSE; err_msg TEXT; wrong_err BOOLEAN := FALSE;
BEGIN
  INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,reference) VALUES ('rml_rec_6_{RUN}','rm_v2','l1','RECEIPT',50,'R6_{RUN}');
  ASSERT (SELECT "quantityOnHand" FROM "RawMaterialStock" WHERE id='rms_v2')=150,'receipt failed';
  INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,"productionJobId",reference) VALUES ('rml_cons_6_{RUN}','rm_v2','l1','CONSUMPTION',30,'pj_v2_{RUN}','C6_{RUN}');
  ASSERT (SELECT "quantityOnHand" FROM "RawMaterialStock" WHERE id='rms_v2')=120,'consumption failed';
  BEGIN
    INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,"productionJobId",reference) VALUES ('rml_over_6_{RUN}','rm_v2','l1','CONSUMPTION',999,'pj_v2_{RUN}','C6b_{RUN}');
  EXCEPTION WHEN OTHERS THEN
    op_failed := TRUE;
    GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
    IF err_msg NOT LIKE '%Insufficient raw material%' THEN wrong_err := TRUE; END IF;
  END;
  IF NOT op_failed THEN RAISE EXCEPTION 'TEST 6 FAILED: over-consumption succeeded'; END IF;
  IF wrong_err THEN RAISE EXCEPTION 'TEST 6 FAILED: wrong error: %', err_msg; END IF;
  RAISE NOTICE 'TEST 6 PASSED: Raw material lifecycle + over-consume rejected';
END $$;

DO $$
DECLARE op_failed BOOLEAN := FALSE; err_msg TEXT; wrong_err BOOLEAN := FALSE;
BEGIN
  INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,"reversesId","productionJobId",reference) VALUES ('rml_rev_7_{RUN}','rm_v2','l1','REVERSAL',10,'rml_cons_6_{RUN}','pj_v2_{RUN}','R7_{RUN}');
  ASSERT (SELECT "quantityOnHand" FROM "RawMaterialStock" WHERE id='rms_v2')=130,'reversal applied';
  BEGIN
    INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,"reversesId","productionJobId",reference) VALUES ('rml_over_7_{RUN}','rm_v2','l1','REVERSAL',25,'rml_cons_6_{RUN}','pj_v2_{RUN}','R7b_{RUN}');
  EXCEPTION WHEN OTHERS THEN
    op_failed := TRUE;
    GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
    IF err_msg NOT LIKE '%REVERSAL exceeds original%' THEN wrong_err := TRUE; END IF;
  END;
  IF NOT op_failed THEN RAISE EXCEPTION 'TEST 7a FAILED'; END IF;
  IF wrong_err THEN RAISE EXCEPTION 'TEST 7a FAILED: wrong error: %', err_msg; END IF;
  RAISE NOTICE 'TEST 7a PASSED: Over-reversal rejected';
END $$;

DO $$
DECLARE op_failed BOOLEAN := FALSE; err_msg TEXT;
BEGIN
  BEGIN
    INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,reference) VALUES ('rml_adj_7b_{RUN}','rm_v2','l1','ADJUSTMENT',5,NULL);
  EXCEPTION WHEN OTHERS THEN
    op_failed := TRUE;
    GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
    IF err_msg NOT LIKE '%ADJUSTMENT requires reference%' THEN RAISE EXCEPTION 'TEST 7b FAILED: wrong: %', err_msg; END IF;
  END;
  IF NOT op_failed THEN RAISE EXCEPTION 'TEST 7b FAILED: no exception'; END IF;
  RAISE NOTICE 'TEST 7b PASSED: ADJUSTMENT requires reference';
END $$;

DO $$
DECLARE op_failed BOOLEAN := FALSE; err_msg TEXT; wrong_err BOOLEAN := FALSE;
BEGIN
  UPDATE "ProductionJob" SET status='IN_PROGRESS' WHERE id='pj_v2_{RUN}';
  UPDATE "ProductionJob" SET status='QC_PENDING' WHERE id='pj_v2_{RUN}';
  BEGIN
    INSERT INTO "ProductionQcHistory"(id,"productionJobId",status,"changedById","sequenceNumber") VALUES ('qc_unauth_8_{RUN}','pj_v2_{RUN}','PASSED','u_cust',1);
  EXCEPTION WHEN OTHERS THEN
    op_failed := TRUE;
    GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
    IF err_msg NOT LIKE '%Unauthorized QC inspector%' THEN wrong_err := TRUE; END IF;
  END;
  IF NOT op_failed THEN RAISE EXCEPTION 'TEST 8 FAILED'; END IF;
  IF wrong_err THEN RAISE EXCEPTION 'TEST 8 FAILED: wrong: %', err_msg; END IF;
  RAISE NOTICE 'TEST 8 PASSED: Unauthorized QC inspector rejected';
END $$;

DO $$
DECLARE op_failed BOOLEAN := FALSE; err_msg TEXT; wrong_err BOOLEAN := FALSE;
BEGIN
  INSERT INTO "ProductionQcHistory"(id,"productionJobId",status,"rejectionReason","changedById","sequenceNumber") VALUES ('qc_rej_9_{RUN}','pj_v2_{RUN}','REJECTED','Defect','u_prod',1);
  UPDATE "ProductionJob" SET status='IN_PROGRESS' WHERE id='pj_v2_{RUN}';
  BEGIN
    INSERT INTO "ProductionQcHistory"(id,"productionJobId",status,"changedById","sequenceNumber") VALUES ('qc_bad_9_{RUN}','pj_v2_{RUN}','PASSED','u_prod',2);
  EXCEPTION WHEN OTHERS THEN
    op_failed := TRUE;
    GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
    IF err_msg NOT LIKE '%QC requires QC_PENDING%' THEN wrong_err := TRUE; END IF;
  END;
  IF NOT op_failed THEN RAISE EXCEPTION 'TEST 9a FAILED'; END IF;
  IF wrong_err THEN RAISE EXCEPTION 'TEST 9a FAILED: wrong: %', err_msg; END IF;
  RAISE NOTICE 'TEST 9a PASSED: QC requires QC_PENDING state';
END $$;

DO $$
DECLARE op_failed BOOLEAN := FALSE; err_msg TEXT; wrong_err BOOLEAN := FALSE;
BEGIN
  UPDATE "ProductionJob" SET status='QC_PENDING' WHERE id='pj_v2_{RUN}';
  BEGIN
    UPDATE "ProductionJob" SET status='COMPLETED' WHERE id='pj_v2_{RUN}';
  EXCEPTION WHEN OTHERS THEN
    op_failed := TRUE;
    GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
    IF err_msg NOT LIKE '%Cannot complete without latest PASSED QC%' THEN wrong_err := TRUE; END IF;
  END;
  IF NOT op_failed THEN RAISE EXCEPTION 'TEST 10a FAILED'; END IF;
  IF wrong_err THEN RAISE EXCEPTION 'TEST 10a FAILED: wrong: %', err_msg; END IF;
  RAISE NOTICE 'TEST 10a PASSED: Completion blocked by REJECTED latest QC';
END $$;

DO $$
BEGIN
  INSERT INTO "ProductionQcHistory"(id,"productionJobId",status,"changedById","sequenceNumber") VALUES ('qc_pass_10_{RUN}','pj_v2_{RUN}','PASSED','u_prod',2);
  UPDATE "ProductionJob" SET status='COMPLETED' WHERE id='pj_v2_{RUN}';
  RAISE NOTICE 'TEST 10b PASSED: Completion allowed after latest PASSED QC';
END $$;

ROLLBACK;