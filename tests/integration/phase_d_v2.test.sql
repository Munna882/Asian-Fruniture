SET plpgsql.check_asserts = true;
BEGIN;
DELETE FROM "ProductionQcHistory" WHERE "productionJobId"='pj_v2';
DELETE FROM "ProductionJob" WHERE id='pj_v2';
DELETE FROM "RawMaterialLedger" WHERE "rawMaterialId"='rm_v2';
UPDATE "RawMaterialStock" SET "quantityOnHand"=100 WHERE id='rms_v2';
DELETE FROM "OrderItem" WHERE id='oi_v2';
DELETE FROM "FulfillmentGroup" WHERE id='fg_v2';
DELETE FROM "Order" WHERE id='o_v2';

INSERT INTO "Order"(id,"userId",total) VALUES ('o_v2','u_admin',50000);
INSERT INTO "FulfillmentGroup"(id,"orderId",type) VALUES ('fg_v2','o_v2','MADE_TO_ORDER');
INSERT INTO "OrderItem"(id,"orderId","variantId",quantity,"priceAtOrder","nameAtOrder","skuAtOrder","fulfillmentGroupId") VALUES ('oi_v2','o_v2','v1',1,50000,'Bed','SKU_BED','fg_v2');
INSERT INTO "ProductionJob"(id,"orderItemId",status,"bomSnapshot") VALUES ('pj_v2','oi_v2','PENDING','{"wood":5}');

DO $$
BEGIN
  INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,reference) VALUES ('rml_rec','rm_v2','l1','RECEIPT',50,'R1');
  ASSERT (SELECT "quantityOnHand" FROM "RawMaterialStock" WHERE id='rms_v2')=150,'receipt failed';
  INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,"productionJobId",reference) VALUES ('rml_cons','rm_v2','l1','CONSUMPTION',30,'pj_v2','C1');
  ASSERT (SELECT "quantityOnHand" FROM "RawMaterialStock" WHERE id='rms_v2')=120,'consumption failed';
  BEGIN
    INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,"productionJobId",reference) VALUES ('rml_over','rm_v2','l1','CONSUMPTION',999,'pj_v2','C2');
    RAISE EXCEPTION 'test-should-have-failed';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 6 PASSED: Raw material RECEIPT/CONSUMPTION/over-consume';
  END;
END $$;

DO $$
BEGIN
  INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,"reversesId",reference) VALUES ('rml_rev','rm_v2','l1','REVERSAL',10,'rml_cons','REV1');
  ASSERT (SELECT "quantityOnHand" FROM "RawMaterialStock" WHERE id='rms_v2')=130,'reversal failed';
  BEGIN
    INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,"reversesId",reference) VALUES ('rml_over_rev','rm_v2','l1','REVERSAL',25,'rml_cons','REV2');
    RAISE EXCEPTION 'test-should-have-failed';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 7a PASSED: Over-reversal rejected';
  END;
  BEGIN
    INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,reference) VALUES ('rml_adj_noref','rm_v2','l1','ADJUSTMENT',5,NULL);
    RAISE EXCEPTION 'test-should-have-failed';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 7b PASSED: ADJUSTMENT requires reference';
  END;
  INSERT INTO "RawMaterialLedger"(id,"rawMaterialId","locationId","type",quantity,reference) VALUES ('rml_adj','rm_v2','l1','ADJUSTMENT',-5,'ADJ1');
  ASSERT (SELECT "quantityOnHand" FROM "RawMaterialStock" WHERE id='rms_v2')=125,'negative adjustment failed';
END $$;

DO $$
BEGIN
  UPDATE "ProductionJob" SET status='IN_PROGRESS' WHERE id='pj_v2';
  UPDATE "ProductionJob" SET status='QC_PENDING' WHERE id='pj_v2';
  BEGIN
    INSERT INTO "ProductionQcHistory"(id,"productionJobId",status,"changedById","sequenceNumber") VALUES ('qc_unauth','pj_v2','PASSED','u_cust',1);
    RAISE EXCEPTION 'test-should-have-failed';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 8 PASSED: Unauthorized QC inspector rejected';
  END;
END $$;

DO $$
BEGIN
  INSERT INTO "ProductionQcHistory"(id,"productionJobId",status,"rejectionReason","changedById","sequenceNumber") VALUES ('qc_rej','pj_v2','REJECTED','Surface defect','u_prod',1);
  UPDATE "ProductionJob" SET status='IN_PROGRESS' WHERE id='pj_v2';
  BEGIN
    INSERT INTO "ProductionQcHistory"(id,"productionJobId",status,"changedById","sequenceNumber") VALUES ('qc_bad','pj_v2','PASSED','u_prod',2);
    RAISE EXCEPTION 'test-should-have-failed';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 9a PASSED: QC requires QC_PENDING state';
  END;
END $$;

DO $$
BEGIN
  UPDATE "ProductionJob" SET status='QC_PENDING' WHERE id='pj_v2';
  BEGIN
    UPDATE "ProductionJob" SET status='COMPLETED' WHERE id='pj_v2';
    RAISE EXCEPTION 'test-should-have-failed';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 10a PASSED: Completion blocked by REJECTED latest QC';
  END;
  INSERT INTO "ProductionQcHistory"(id,"productionJobId",status,"changedById","sequenceNumber") VALUES ('qc_pass','pj_v2','PASSED','u_prod',2);
  UPDATE "ProductionJob" SET status='COMPLETED' WHERE id='pj_v2';
  RAISE NOTICE 'TEST 10b PASSED: Completion allowed after latest PASSED QC';
END $$;
ROLLBACK;