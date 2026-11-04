CREATE OR REPLACE FUNCTION manage_inventory_lifecycle() RETURNS TRIGGER AS $$
DECLARE cur_on INT; cur_res INT;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'StockLedger is append-only'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.quantity = 0 THEN RAISE EXCEPTION 'quantity cannot be zero'; END IF;
    IF NEW."type" = 'DISPATCH' THEN RAISE EXCEPTION 'Direct DISPATCH prohibited'; END IF;
    IF NEW."type" != 'OPENING_BALANCE' AND NEW.status != 'ACTIVE' THEN RAISE EXCEPTION 'New entries must be ACTIVE'; END IF;
    IF NEW."type" IN ('RECEIPT','TRANSFER_IN','RESTOCK') AND NEW.quantity < 0 THEN RAISE EXCEPTION 'Positive movement requires positive quantity'; END IF;
    IF NEW."type" = 'TRANSFER_OUT' AND NEW.quantity > 0 THEN RAISE EXCEPTION 'Negative movement requires negative quantity'; END IF;
    IF NEW."type" = 'RESERVATION' AND NEW.quantity > 0 THEN RAISE EXCEPTION 'Reservation must be negative'; END IF;
    INSERT INTO "InventoryStock" (id,"variantId","locationId") VALUES (gen_random_uuid(),NEW."variantId",NEW."locationId") ON CONFLICT DO NOTHING;
    SELECT "quantityOnHand","quantityReserved" INTO cur_on,cur_res FROM "InventoryStock" WHERE "variantId"=NEW."variantId" AND "locationId"=NEW."locationId" FOR UPDATE;
    IF NEW."type" = 'RESERVATION' THEN
      IF (cur_on-cur_res) < ABS(NEW.quantity) THEN RAISE EXCEPTION 'Insufficient available stock'; END IF;
      UPDATE "InventoryStock" SET "quantityReserved"="quantityReserved"+ABS(NEW.quantity) WHERE "variantId"=NEW."variantId" AND "locationId"=NEW."locationId";
    ELSIF NEW."type" IN ('RECEIPT','TRANSFER_IN','RESTOCK','TRANSFER_OUT','ADJUSTMENT','OPENING_BALANCE') THEN
      UPDATE "InventoryStock" SET "quantityOnHand"="quantityOnHand"+NEW.quantity WHERE "variantId"=NEW."variantId" AND "locationId"=NEW."locationId";
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD."variantId"!=NEW."variantId" OR OLD.quantity!=NEW.quantity OR OLD."type"!=NEW."type" OR OLD."locationId"!=NEW."locationId" THEN RAISE EXCEPTION 'Identity fields immutable'; END IF;
    IF OLD."type"!='RESERVATION' THEN RAISE EXCEPTION 'Only reservations can change status'; END IF;
    IF OLD.status='CANCELLED' THEN RAISE EXCEPTION 'Cancelled cannot be reactivated'; END IF;
    IF OLD.status='ACTIVE' AND NEW.status='CANCELLED' THEN
      UPDATE "InventoryStock" SET "quantityReserved"="quantityReserved"-ABS(NEW.quantity) WHERE "variantId"=NEW."variantId" AND "locationId"=NEW."locationId";
    ELSIF OLD.status='ACTIVE' AND NEW.status='FULFILLED' THEN
      UPDATE "InventoryStock" SET "quantityReserved"="quantityReserved"-ABS(NEW.quantity),"quantityOnHand"="quantityOnHand"-ABS(NEW.quantity) WHERE "variantId"=NEW."variantId" AND "locationId"=NEW."locationId";
    ELSE RAISE EXCEPTION 'Invalid status transition'; END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_inventory ON "StockLedger";
CREATE TRIGGER trg_inventory BEFORE INSERT OR UPDATE OR DELETE ON "StockLedger" FOR EACH ROW EXECUTE FUNCTION manage_inventory_lifecycle();

CREATE OR REPLACE FUNCTION prevent_financial_mod() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'Financial records are immutable'; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_immutable_ledger ON "FinancialLedger";
CREATE TRIGGER trg_immutable_ledger BEFORE UPDATE OR DELETE ON "FinancialLedger" FOR EACH ROW EXECUTE FUNCTION prevent_financial_mod();
DROP TRIGGER IF EXISTS trg_immutable_alloc ON "PaymentAllocation";
CREATE TRIGGER trg_immutable_alloc BEFORE UPDATE OR DELETE ON "PaymentAllocation" FOR EACH ROW EXECUTE FUNCTION prevent_financial_mod();
DROP TRIGGER IF EXISTS trg_immutable_qc ON "ProductionQcHistory";
CREATE TRIGGER trg_immutable_qc BEFORE UPDATE OR DELETE ON "ProductionQcHistory" FOR EACH ROW EXECUTE FUNCTION prevent_financial_mod();

CREATE OR REPLACE FUNCTION check_dispatch_guard() RETURNS TRIGGER AS $$
DECLARE missing INT; unpaid INT;
BEGIN
  IF NEW.status='DISPATCHED' AND (TG_OP='INSERT' OR OLD.status!='DISPATCHED') THEN
    IF NOT EXISTS(SELECT 1 FROM "Delivery" WHERE "fulfillmentGroupId"=NEW.id) THEN RAISE EXCEPTION 'Delivery record missing'; END IF;
    SELECT COUNT(*) INTO missing FROM (SELECT 'PRODUCT_BALANCE'::text AS t UNION ALL SELECT 'DELIVERY_CHARGE'::text) r
      WHERE NOT EXISTS(SELECT 1 FROM "PaymentObligation" po WHERE po."fulfillmentGroupId"=NEW.id AND po."type"::text=r.t AND po.status!='VOID' AND po.amount>0);
    IF missing>0 THEN RAISE EXCEPTION 'Required obligations missing'; END IF;
    SELECT COUNT(*) INTO unpaid FROM "PaymentObligation" po
      WHERE po."fulfillmentGroupId"=NEW.id AND po."type"::text IN ('PRODUCT_BALANCE','DELIVERY_CHARGE') AND po.status!='VOID' AND po.amount>0
      AND (SELECT COALESCE(SUM(pa.amount),0) FROM "PaymentAllocation" pa JOIN "FinancialLedger" fl ON pa."ledgerId"=fl.id WHERE pa."obligationId"=po.id AND fl."type"::text='PAYMENT') < po.amount;
    IF unpaid>0 THEN RAISE EXCEPTION 'Unpaid obligations exist'; END IF;
    UPDATE "Delivery" SET status='DISPATCHED' WHERE "fulfillmentGroupId"=NEW.id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_dispatch ON "FulfillmentGroup";
CREATE TRIGGER trg_dispatch BEFORE INSERT OR UPDATE ON "FulfillmentGroup" FOR EACH ROW EXECUTE FUNCTION check_dispatch_guard();

CREATE OR REPLACE FUNCTION check_refund_processing() RETURNS TRIGGER AS $$
DECLARE total BIGINT; otype TEXT; ptype TEXT; pamt BIGINT;
BEGIN
  IF NEW.status='PROCESSED' AND OLD.status!='PROCESSED' THEN
    SELECT "type"::text INTO otype FROM "FinancialLedger" WHERE id=NEW."originalLedgerId";
    IF otype!='PAYMENT' THEN RAISE EXCEPTION 'Can only refund PAYMENT'; END IF;
    IF NEW."processedLedgerId" IS NULL THEN RAISE EXCEPTION 'Processed refund requires processedLedgerId'; END IF;
    SELECT "type"::text,amount INTO ptype,pamt FROM "FinancialLedger" WHERE id=NEW."processedLedgerId";
    IF ptype!='REFUND' THEN RAISE EXCEPTION 'Processed ledger must be REFUND'; END IF;
    IF pamt != -NEW.amount THEN RAISE EXCEPTION 'Processed refund amount mismatch'; END IF;
    SELECT COALESCE(SUM(amount),0) INTO total FROM "RefundAllocation" WHERE "refundRequestId"=NEW.id;
    IF total != NEW.amount THEN RAISE EXCEPTION 'Refund allocations do not match request amount'; END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_refund_processing ON "RefundRequest";
CREATE TRIGGER trg_refund_processing BEFORE UPDATE ON "RefundRequest" FOR EACH ROW EXECUTE FUNCTION check_refund_processing();