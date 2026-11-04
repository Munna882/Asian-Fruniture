-- Inventory lifecycle
CREATE OR REPLACE FUNCTION manage_inventory_lifecycle() RETURNS TRIGGER AS $$
DECLARE cur_on INT; cur_res INT;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'StockLedger is append-only'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.quantity = 0 THEN RAISE EXCEPTION 'quantity cannot be zero'; END IF;
    IF NEW."type" = 'DISPATCH' THEN RAISE EXCEPTION 'Direct DISPATCH prohibited'; END IF;
    IF NEW."type" != 'OPENING_BALANCE' AND NEW.status != 'ACTIVE' THEN RAISE EXCEPTION 'New entries must be ACTIVE'; END IF;
    IF NEW."type" IN ('RECEIPT','TRANSFER_IN','RESTOCK') AND NEW.quantity < 0 THEN RAISE EXCEPTION 'Positive movement requires positive quantity'; END IF;
    IF NEW."type" = 'TRANSFER_OUT' AND NEW.quantity > 0 THEN RAISE EXCEPTION 'TRANSFER_OUT requires negative quantity'; END IF;
    IF NEW."type" = 'RESERVATION' AND NEW.quantity > 0 THEN RAISE EXCEPTION 'Reservation must be negative'; END IF;
    IF NEW."type" IN ('TRANSFER_IN','TRANSFER_OUT') AND NEW."transferGroupId" IS NULL THEN RAISE EXCEPTION 'Transfer requires transferGroupId'; END IF;
    INSERT INTO "InventoryStock" (id,"variantId","locationId") VALUES (gen_random_uuid(),NEW."variantId",NEW."locationId") ON CONFLICT DO NOTHING;
    SELECT "quantityOnHand","quantityReserved" INTO cur_on,cur_res FROM "InventoryStock" WHERE "variantId"=NEW."variantId" AND "locationId"=NEW."locationId" FOR UPDATE;
    IF NEW."type" = 'RESERVATION' THEN
      IF (cur_on-cur_res) < ABS(NEW.quantity) THEN RAISE EXCEPTION 'Insufficient available stock'; END IF;
      UPDATE "InventoryStock" SET "quantityReserved"="quantityReserved"+ABS(NEW.quantity) WHERE "variantId"=NEW."variantId" AND "locationId"=NEW."locationId";
    ELSIF NEW."type" IN ('RECEIPT','TRANSFER_IN','RESTOCK','TRANSFER_OUT','ADJUSTMENT','OPENING_BALANCE') THEN
      UPDATE "InventoryStock" SET "quantityOnHand"="quantityOnHand"+NEW.quantity WHERE "variantId"=NEW."variantId" AND "locationId"=NEW."locationId";
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD."variantId"!=NEW."variantId" OR OLD.quantity!=NEW.quantity OR OLD."type"!=NEW."type" OR OLD."locationId"!=NEW."locationId" OR OLD."orderItemId" IS DISTINCT FROM NEW."orderItemId" OR OLD.reference!=NEW.reference THEN RAISE EXCEPTION 'Identity fields immutable'; END IF;
    IF OLD."type"!='RESERVATION' THEN RAISE EXCEPTION 'Only reservations may change status'; END IF;
    IF OLD.status='CANCELLED' THEN RAISE EXCEPTION 'Cancelled reservation cannot be reactivated'; END IF;
    IF OLD.status='ACTIVE' AND NEW.status='CANCELLED' THEN
      UPDATE "InventoryStock" SET "quantityReserved"="quantityReserved"-ABS(NEW.quantity) WHERE "variantId"=NEW."variantId" AND "locationId"=NEW."locationId";
    ELSIF OLD.status='ACTIVE' AND NEW.status='FULFILLED' THEN
      UPDATE "InventoryStock" SET "quantityReserved"="quantityReserved"-ABS(NEW.quantity),"quantityOnHand"="quantityOnHand"-ABS(NEW.quantity) WHERE "variantId"=NEW."variantId" AND "locationId"=NEW."locationId";
    ELSE RAISE EXCEPTION 'Invalid status transition'; END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Transfer pairing (exact-count enforcement)
CREATE OR REPLACE FUNCTION check_transfer_pairing() RETURNS TRIGGER AS $$
DECLARE out_count INT; in_count INT; out_rec RECORD; in_rec RECORD;
BEGIN
  IF NEW."transferGroupId" IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO out_count FROM "StockLedger" WHERE "transferGroupId"=NEW."transferGroupId" AND "type"='TRANSFER_OUT';
  SELECT COUNT(*) INTO in_count FROM "StockLedger" WHERE "transferGroupId"=NEW."transferGroupId" AND "type"='TRANSFER_IN';
  IF out_count != 1 OR in_count != 1 THEN RAISE EXCEPTION 'Transfer % must have exactly one OUT and one IN (found out=%, in=%)', NEW."transferGroupId", out_count, in_count; END IF;
  SELECT "variantId", quantity, "locationId" INTO out_rec FROM "StockLedger" WHERE "transferGroupId"=NEW."transferGroupId" AND "type"='TRANSFER_OUT';
  SELECT "variantId", quantity, "locationId" INTO in_rec FROM "StockLedger" WHERE "transferGroupId"=NEW."transferGroupId" AND "type"='TRANSFER_IN';
  IF out_rec."variantId" != in_rec."variantId" THEN RAISE EXCEPTION 'Transfer variant mismatch: % vs %', out_rec."variantId", in_rec."variantId"; END IF;
  IF ABS(out_rec.quantity) != ABS(in_rec.quantity) THEN RAISE EXCEPTION 'Transfer quantity mismatch: % vs %', out_rec.quantity, in_rec.quantity; END IF;
  IF out_rec."locationId" = in_rec."locationId" THEN RAISE EXCEPTION 'Transfer source and destination must differ'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Financial immutability
CREATE OR REPLACE FUNCTION prevent_financial_mod() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'Financial records are immutable'; END;
$$ LANGUAGE plpgsql;

-- Payment allocation limits
CREATE OR REPLACE FUNCTION check_payment_allocation() RETURNS TRIGGER AS $$
DECLARE ob_amt BIGINT; ob_st "ObligationStatus"; l_amt BIGINT; l_tp "LedgerTransactionType"; t_ob BIGINT; t_l BIGINT;
BEGIN
  IF NEW.amount <= 0 THEN RAISE EXCEPTION 'Allocation must be positive'; END IF;
  SELECT amount, status INTO ob_amt, ob_st FROM "PaymentObligation" WHERE id=NEW."obligationId" FOR UPDATE;
  IF ob_st='VOID' THEN RAISE EXCEPTION 'Cannot allocate to VOID obligation'; END IF;
  SELECT amount, "type" INTO l_amt, l_tp FROM "FinancialLedger" WHERE id=NEW."ledgerId" FOR UPDATE;
  IF l_tp != 'PAYMENT' THEN RAISE EXCEPTION 'Only PAYMENT ledger allocations allowed'; END IF;
  SELECT COALESCE(SUM(amount),0) INTO t_ob FROM "PaymentAllocation" WHERE "obligationId"=NEW."obligationId";
  IF (t_ob + NEW.amount) > ob_amt THEN RAISE EXCEPTION 'Allocation exceeds obligation'; END IF;
  SELECT COALESCE(SUM(amount),0) INTO t_l FROM "PaymentAllocation" WHERE "ledgerId"=NEW."ledgerId";
  IF (t_l + NEW.amount) > l_amt THEN RAISE EXCEPTION 'Allocation exceeds ledger'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Dispatch guard
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

-- Refund processing
CREATE OR REPLACE FUNCTION check_refund_processing() RETURNS TRIGGER AS $$
DECLARE total BIGINT; otype "LedgerTransactionType"; ptype "LedgerTransactionType"; pamt BIGINT;
BEGIN
  IF NEW.status='PROCESSED' AND OLD.status!='PROCESSED' THEN
    SELECT "type" INTO otype FROM "FinancialLedger" WHERE id=NEW."originalLedgerId";
    IF otype!='PAYMENT' THEN RAISE EXCEPTION 'Can only refund PAYMENT'; END IF;
    IF NEW."processedLedgerId" IS NULL THEN RAISE EXCEPTION 'Processed refund requires processedLedgerId'; END IF;
    SELECT "type",amount INTO ptype,pamt FROM "FinancialLedger" WHERE id=NEW."processedLedgerId";
    IF ptype!='REFUND' THEN RAISE EXCEPTION 'Processed ledger must be REFUND'; END IF;
    IF pamt != -NEW.amount THEN RAISE EXCEPTION 'Processed refund amount mismatch'; END IF;
    SELECT COALESCE(SUM(amount),0) INTO total FROM "RefundAllocation" WHERE "refundRequestId"=NEW.id;
    IF total != NEW.amount THEN RAISE EXCEPTION 'Refund allocations do not match request amount'; END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Raw material (with ADJUSTMENT authorization + reason)
CREATE OR REPLACE FUNCTION manage_raw_material() RETURNS TRIGGER AS $$
DECLARE cur_on INT; orig RECORD; rev_total INT; approver_role "RoleType";
BEGIN
  IF TG_OP='DELETE' OR TG_OP='UPDATE' THEN RAISE EXCEPTION 'RawMaterialLedger append-only'; END IF;
  IF NEW.quantity = 0 THEN RAISE EXCEPTION 'Quantity cannot be zero'; END IF;
  IF NEW."type" != 'ADJUSTMENT' AND NEW.quantity < 0 THEN RAISE EXCEPTION 'Only ADJUSTMENT may be negative'; END IF;
  INSERT INTO "RawMaterialStock"(id,"rawMaterialId","locationId") VALUES (gen_random_uuid(),NEW."rawMaterialId",NEW."locationId") ON CONFLICT DO NOTHING;
  SELECT "quantityOnHand" INTO cur_on FROM "RawMaterialStock" WHERE "rawMaterialId"=NEW."rawMaterialId" AND "locationId"=NEW."locationId" FOR UPDATE;
  IF NEW."type"='RECEIPT' THEN
    UPDATE "RawMaterialStock" SET "quantityOnHand"="quantityOnHand"+NEW.quantity WHERE "rawMaterialId"=NEW."rawMaterialId" AND "locationId"=NEW."locationId";
  ELSIF NEW."type"='CONSUMPTION' THEN
    IF NEW."productionJobId" IS NULL THEN RAISE EXCEPTION 'CONSUMPTION requires productionJobId'; END IF;
    IF cur_on < NEW.quantity THEN RAISE EXCEPTION 'Insufficient raw material: have %, need %', cur_on, NEW.quantity; END IF;
    UPDATE "RawMaterialStock" SET "quantityOnHand"="quantityOnHand"-NEW.quantity WHERE "rawMaterialId"=NEW."rawMaterialId" AND "locationId"=NEW."locationId";
  ELSIF NEW."type"='REVERSAL' THEN
    IF NEW."reversesId" IS NULL THEN RAISE EXCEPTION 'REVERSAL requires reversesId'; END IF;
    SELECT * INTO orig FROM "RawMaterialLedger" WHERE id=NEW."reversesId" AND "type"='CONSUMPTION';
    IF orig.id IS NULL THEN RAISE EXCEPTION 'reversesId must reference CONSUMPTION'; END IF;
    IF orig."rawMaterialId" != NEW."rawMaterialId" THEN RAISE EXCEPTION 'REVERSAL material mismatch'; END IF;
    IF orig."locationId" != NEW."locationId" THEN RAISE EXCEPTION 'REVERSAL location mismatch'; END IF;
    IF orig."productionJobId" IS DISTINCT FROM NEW."productionJobId" THEN RAISE EXCEPTION 'REVERSAL production job mismatch'; END IF;
    SELECT COALESCE(SUM(quantity),0) INTO rev_total FROM "RawMaterialLedger" WHERE "reversesId"=NEW."reversesId" AND "type"='REVERSAL';
    IF (rev_total + NEW.quantity) > orig.quantity THEN RAISE EXCEPTION 'REVERSAL exceeds original'; END IF;
    UPDATE "RawMaterialStock" SET "quantityOnHand"="quantityOnHand"+NEW.quantity WHERE "rawMaterialId"=NEW."rawMaterialId" AND "locationId"=NEW."locationId";
  ELSIF NEW."type"='ADJUSTMENT' THEN
    IF NEW.reference IS NULL THEN RAISE EXCEPTION 'ADJUSTMENT requires reference'; END IF;
    IF NEW.reason IS NULL OR LENGTH(TRIM(NEW.reason)) = 0 THEN RAISE EXCEPTION 'ADJUSTMENT requires reason'; END IF;
    IF NEW."approvedById" IS NULL THEN RAISE EXCEPTION 'ADJUSTMENT requires approvedById'; END IF;
    SELECT role INTO approver_role FROM "User" WHERE id=NEW."approvedById";
    IF approver_role IS NULL OR approver_role NOT IN ('FINANCE_MANAGER','SUPER_ADMIN') THEN RAISE EXCEPTION 'ADJUSTMENT approver must be FINANCE_MANAGER or SUPER_ADMIN, got %', COALESCE(approver_role::text,'NULL'); END IF;
    IF (cur_on + NEW.quantity) < 0 THEN RAISE EXCEPTION 'ADJUSTMENT would make stock negative'; END IF;
    UPDATE "RawMaterialStock" SET "quantityOnHand"="quantityOnHand"+NEW.quantity WHERE "rawMaterialId"=NEW."rawMaterialId" AND "locationId"=NEW."locationId";
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- QC authorization
CREATE OR REPLACE FUNCTION check_qc_insert() RETURNS TRIGGER AS $$
DECLARE job_st "ProductionStatus"; u_role "RoleType"; u_can BOOLEAN;
BEGIN
  SELECT role, "canApproveQc" INTO u_role, u_can FROM "User" WHERE id=NEW."changedById";
  IF u_role NOT IN ('PRODUCTION_MANAGER','SUPER_ADMIN') AND NOT COALESCE(u_can,false) THEN RAISE EXCEPTION 'Unauthorized QC inspector: role=%, canApproveQc=%', u_role, u_can; END IF;
  SELECT status INTO job_st FROM "ProductionJob" WHERE id=NEW."productionJobId" FOR UPDATE;
  IF job_st!='QC_PENDING' THEN RAISE EXCEPTION 'QC requires QC_PENDING state, got %', job_st; END IF;
  IF NEW.status='REJECTED' AND NEW."rejectionReason" IS NULL THEN RAISE EXCEPTION 'REJECTED QC requires rejectionReason'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Production state machine
CREATE OR REPLACE FUNCTION check_production_transition() RETURNS TRIGGER AS $$
DECLARE latest "QCStatus";
BEGIN
  IF TG_OP='INSERT' AND NEW.status='COMPLETED' THEN RAISE EXCEPTION 'Cannot insert job as COMPLETED'; END IF;
  IF TG_OP='UPDATE' THEN
    IF OLD.status='PENDING' AND NEW.status NOT IN ('IN_PROGRESS','CANCELLED') THEN RAISE EXCEPTION 'Invalid PENDING -> %', NEW.status; END IF;
    IF OLD.status='IN_PROGRESS' AND NEW.status NOT IN ('QC_PENDING','CANCELLED') THEN RAISE EXCEPTION 'Invalid IN_PROGRESS -> %', NEW.status; END IF;
    IF OLD.status='QC_PENDING' AND NEW.status NOT IN ('IN_PROGRESS','COMPLETED') THEN RAISE EXCEPTION 'Invalid QC_PENDING -> %', NEW.status; END IF;
    IF OLD.status='QC_PENDING' AND NEW.status='COMPLETED' THEN
      SELECT status INTO latest FROM "ProductionQcHistory" WHERE "productionJobId"=NEW.id ORDER BY "sequenceNumber" DESC LIMIT 1;
      IF latest IS NULL OR latest!='PASSED' THEN RAISE EXCEPTION 'Cannot complete without latest PASSED QC'; END IF;
    END IF;
    IF OLD.status IN ('COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'Job immutable in state %', OLD.status; END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- ALTER: Add missing columns (idempotent for schema variants)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canApproveQc" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RawMaterialLedger" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "RawMaterialLedger" ADD COLUMN IF NOT EXISTS "reason" TEXT;

-- Drop and recreate all triggers with V3 definitions
DROP TRIGGER IF EXISTS trg_inventory ON "StockLedger";
CREATE TRIGGER trg_inventory BEFORE INSERT OR UPDATE OR DELETE ON "StockLedger" FOR EACH ROW EXECUTE FUNCTION manage_inventory_lifecycle();

DROP TRIGGER IF EXISTS trg_transfer_pairing ON "StockLedger";
CREATE CONSTRAINT TRIGGER trg_transfer_pairing AFTER INSERT ON "StockLedger" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_transfer_pairing();

DROP TRIGGER IF EXISTS trg_immutable_ledger ON "FinancialLedger";
CREATE TRIGGER trg_immutable_ledger BEFORE UPDATE OR DELETE ON "FinancialLedger" FOR EACH ROW EXECUTE FUNCTION prevent_financial_mod();

DROP TRIGGER IF EXISTS trg_immutable_alloc ON "PaymentAllocation";
CREATE TRIGGER trg_immutable_alloc BEFORE UPDATE OR DELETE ON "PaymentAllocation" FOR EACH ROW EXECUTE FUNCTION prevent_financial_mod();

DROP TRIGGER IF EXISTS trg_immutable_qc ON "ProductionQcHistory";
CREATE TRIGGER trg_immutable_qc BEFORE UPDATE OR DELETE ON "ProductionQcHistory" FOR EACH ROW EXECUTE FUNCTION prevent_financial_mod();

DROP TRIGGER IF EXISTS trg_payment_alloc ON "PaymentAllocation";
CREATE TRIGGER trg_payment_alloc BEFORE INSERT ON "PaymentAllocation" FOR EACH ROW EXECUTE FUNCTION check_payment_allocation();

DROP TRIGGER IF EXISTS trg_dispatch ON "FulfillmentGroup";
CREATE TRIGGER trg_dispatch BEFORE INSERT OR UPDATE ON "FulfillmentGroup" FOR EACH ROW EXECUTE FUNCTION check_dispatch_guard();

DROP TRIGGER IF EXISTS trg_refund_processing ON "RefundRequest";
CREATE TRIGGER trg_refund_processing BEFORE UPDATE ON "RefundRequest" FOR EACH ROW EXECUTE FUNCTION check_refund_processing();

DROP TRIGGER IF EXISTS trg_raw_material ON "RawMaterialLedger";
CREATE TRIGGER trg_raw_material BEFORE INSERT OR UPDATE OR DELETE ON "RawMaterialLedger" FOR EACH ROW EXECUTE FUNCTION manage_raw_material();

DROP TRIGGER IF EXISTS trg_qc_insert ON "ProductionQcHistory";
CREATE TRIGGER trg_qc_insert BEFORE INSERT ON "ProductionQcHistory" FOR EACH ROW EXECUTE FUNCTION check_qc_insert();

DROP TRIGGER IF EXISTS trg_production_transition ON "ProductionJob";
CREATE TRIGGER trg_production_transition BEFORE INSERT OR UPDATE ON "ProductionJob" FOR EACH ROW EXECUTE FUNCTION check_production_transition();