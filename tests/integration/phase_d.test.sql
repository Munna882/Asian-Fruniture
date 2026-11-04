SET plpgsql.check_asserts = true;
BEGIN;
DELETE FROM "StockLedger" WHERE "reference" IN ('RES1','RES2');
UPDATE "InventoryStock" SET "quantityOnHand"=10,"quantityReserved"=0 WHERE id='is1';
INSERT INTO "Order"(id,"userId",total) VALUES ('o1','u_admin',20000) ON CONFLICT DO NOTHING;
INSERT INTO "FulfillmentGroup"(id,"orderId",type) VALUES ('fg1','o1','READY_STOCK') ON CONFLICT DO NOTHING;
INSERT INTO "Delivery"(id,"fulfillmentGroupId") VALUES ('d1','fg1') ON CONFLICT DO NOTHING;
INSERT INTO "OrderItem"(id,"orderId","variantId",quantity,"priceAtOrder","nameAtOrder","skuAtOrder","fulfillmentGroupId") VALUES ('oi1','o1','v1',1,10000,'Sofa','SKU1','fg1') ON CONFLICT DO NOTHING;

DO $$
BEGIN
  INSERT INTO "StockLedger"(id,"variantId","locationId","orderItemId","type",quantity,status,reference) VALUES ('sl1','v1','l1','oi1','RESERVATION',-1,'ACTIVE','RES1');
  ASSERT (SELECT "quantityReserved" FROM "InventoryStock" WHERE id='is1')=1,'reservation failed';
  UPDATE "StockLedger" SET status='CANCELLED' WHERE id='sl1';
  ASSERT (SELECT "quantityReserved" FROM "InventoryStock" WHERE id='is1')=0,'cancel did not free reserved';
  ASSERT (SELECT "quantityOnHand" FROM "InventoryStock" WHERE id='is1')=10,'cancel changed on-hand';
  INSERT INTO "StockLedger"(id,"variantId","locationId","orderItemId","type",quantity,status,reference) VALUES ('sl2','v1','l1','oi1','RESERVATION',-1,'ACTIVE','RES2');
  UPDATE "StockLedger" SET status='FULFILLED' WHERE id='sl2';
  ASSERT (SELECT "quantityReserved" FROM "InventoryStock" WHERE id='is1')=0,'fulfill did not release reserved';
  ASSERT (SELECT "quantityOnHand" FROM "InventoryStock" WHERE id='is1')=9,'fulfill did not decrement on-hand';
  RAISE NOTICE 'TEST 1 PASSED: Inventory lifecycle correct';
END $$;

DO $$
DECLARE err TEXT;
BEGIN
  BEGIN
    UPDATE "FulfillmentGroup" SET status='DISPATCHED' WHERE id='fg1';
    RAISE EXCEPTION 'test-should-have-failed';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err=MESSAGE_TEXT;
    IF err NOT LIKE '%Required obligations missing%' THEN RAISE EXCEPTION 'unexpected: %',err; END IF;
    RAISE NOTICE 'TEST 2 PASSED: Dispatch blocked for missing obligations';
  END;
END $$;

INSERT INTO "FinancialLedger"(id,"orderId","type",amount,reference) VALUES ('fl1','o1','PAYMENT',20000,'REF1') ON CONFLICT DO NOTHING;
INSERT INTO "PaymentObligation"(id,"orderId","fulfillmentGroupId","type",amount) VALUES ('po1','o1','fg1','PRODUCT_BALANCE',10000) ON CONFLICT DO NOTHING;
INSERT INTO "PaymentObligation"(id,"orderId","fulfillmentGroupId","type",amount) VALUES ('po2','o1','fg1','DELIVERY_CHARGE',5000) ON CONFLICT DO NOTHING;
INSERT INTO "PaymentAllocation"(id,"ledgerId","obligationId","orderId",amount) VALUES ('pa1','fl1','po1','o1',10000) ON CONFLICT DO NOTHING;
INSERT INTO "PaymentAllocation"(id,"ledgerId","obligationId","orderId",amount) VALUES ('pa2','fl1','po2','o1',5000) ON CONFLICT DO NOTHING;

DO $$
DECLARE err TEXT;
BEGIN
  INSERT INTO "RefundRequest"(id,"originalLedgerId",amount,reason,status) VALUES ('rr1','fl1',5000,'Return','APPROVED') ON CONFLICT DO NOTHING;
  INSERT INTO "FinancialLedger"(id,"orderId","type",amount,reference) VALUES ('fl2','o1','REFUND',-5000,'REF2') ON CONFLICT DO NOTHING;
  BEGIN
    UPDATE "RefundRequest" SET status='PROCESSED',"processedLedgerId"='fl2' WHERE id='rr1';
    RAISE EXCEPTION 'test-should-have-failed';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err=MESSAGE_TEXT;
    IF err NOT LIKE '%Refund allocations do not match%' THEN RAISE EXCEPTION 'unexpected: %',err; END IF;
    RAISE NOTICE 'TEST 3a PASSED: Refund blocked without allocations';
  END;
END $$;

INSERT INTO "RefundAllocation"(id,"refundRequestId","originalLedgerId","originalAllocationId",amount) VALUES ('ra1','rr1','fl1','pa1',5000) ON CONFLICT DO NOTHING;
UPDATE "RefundRequest" SET status='PROCESSED',"processedLedgerId"='fl2' WHERE id='rr1';
DO $$ BEGIN RAISE NOTICE 'TEST 3b PASSED: Refund processed with valid allocations'; END $$;

DO $$
BEGIN
  UPDATE "FulfillmentGroup" SET status='DISPATCHED' WHERE id='fg1';
  ASSERT (SELECT status FROM "Delivery" WHERE id='d1')='DISPATCHED','delivery not updated';
  RAISE NOTICE 'TEST 4 PASSED: Dispatch succeeded with paid obligations';
END $$;

DO $$
DECLARE err TEXT;
BEGIN
  BEGIN
    UPDATE "FinancialLedger" SET amount=0 WHERE id='fl1';
    RAISE EXCEPTION 'test-should-have-failed';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err=MESSAGE_TEXT;
    IF err NOT LIKE '%immutable%' THEN RAISE EXCEPTION 'unexpected: %',err; END IF;
    RAISE NOTICE 'TEST 5 PASSED: Financial ledger immutable';
  END;
END $$;
ROLLBACK;