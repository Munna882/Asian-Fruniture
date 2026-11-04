-- Payment allocation limits
CREATE OR REPLACE FUNCTION check_payment_allocation() RETURNS TRIGGER AS $$
DECLARE ob_amt BIGINT; ob_st "ObligationStatus"; l_amt BIGINT; l_tp "LedgerTransactionType"; t_ob BIGINT; t_l BIGINT;
BEGIN
  IF NEW.amount <= 0 THEN RAISE EXCEPTION 'Allocation must be positive'; END IF;
  SELECT amount, status INTO ob_amt, ob_st FROM "PaymentObligation" WHERE id = NEW."obligationId" FOR UPDATE;
  IF ob_st = 'VOID' THEN RAISE EXCEPTION 'Cannot allocate to VOID obligation'; END IF;
  SELECT amount, "type" INTO l_amt, l_tp FROM "FinancialLedger" WHERE id = NEW."ledgerId" FOR UPDATE;
  IF l_tp != 'PAYMENT' THEN RAISE EXCEPTION 'Only PAYMENT ledger allocations allowed'; END IF;
  SELECT COALESCE(SUM(amount),0) INTO t_ob FROM "PaymentAllocation" WHERE "obligationId" = NEW."obligationId";
  IF (t_ob + NEW.amount) > ob_amt THEN RAISE EXCEPTION 'Exceeds obligation limit (% + % > %)', t_ob, NEW.amount, ob_amt; END IF;
  SELECT COALESCE(SUM(amount),0) INTO t_l FROM "PaymentAllocation" WHERE "ledgerId" = NEW."ledgerId";
  IF (t_l + NEW.amount) > l_amt THEN RAISE EXCEPTION 'Exceeds ledger limit'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_payment_alloc ON "PaymentAllocation";
CREATE TRIGGER trg_payment_alloc BEFORE INSERT ON "PaymentAllocation" FOR EACH ROW EXECUTE FUNCTION check_payment_allocation();

-- Transfer pairing (deferred — fires at COMMIT)
CREATE OR REPLACE FUNCTION check_transfer_pairing() RETURNS TRIGGER AS $$
DECLARE out_c INT; in_c INT;
BEGIN
  IF NEW."transferGroupId" IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO out_c FROM "StockLedger" WHERE "transferGroupId" = NEW."transferGroupId" AND "type" = 'TRANSFER_OUT';
  SELECT COUNT(*) INTO in_c FROM "StockLedger" WHERE "transferGroupId" = NEW."transferGroupId" AND "type" = 'TRANSFER_IN';
  IF out_c != 1 OR in_c != 1 THEN RAISE EXCEPTION 'Transfer % requires exactly one TRANSFER_OUT and one TRANSFER_IN (found: out=%, in=%)', NEW."transferGroupId", out_c, in_c; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_transfer_pairing ON "StockLedger";
CREATE CONSTRAINT TRIGGER trg_transfer_pairing AFTER INSERT ON "StockLedger"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_transfer_pairing();

-- Raw material lifecycle
CREATE OR REPLACE FUNCTION manage_raw_material() RETURNS TRIGGER AS $$
DECLARE cur_on INT; orig_qty INT; rev_rev INT;
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'RawMaterialLedger append-only'; END IF;
  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'RawMaterialLedger immutable'; END IF;
  IF NEW.quantity = 0 THEN RAISE EXCEPTION 'Quantity cannot be zero'; END IF;
  IF NEW."type" != 'ADJUSTMENT' AND NEW.quantity < 0 THEN RAISE EXCEPTION 'Only ADJUSTMENT may be negative'; END IF;
  INSERT INTO "RawMaterialStock"(id,"rawMaterialId","locationId") VALUES (gen_random_uuid(), NEW."rawMaterialId", NEW."locationId") ON CONFLICT DO NOTHING;
  SELECT "quantityOnHand" INTO cur_on FROM "RawMaterialStock" WHERE "rawMaterialId"=NEW."rawMaterialId" AND "locationId"=NEW."locationId" FOR UPDATE;
  IF NEW."type" = 'RECEIPT' THEN
    UPDATE "RawMaterialStock" SET "quantityOnHand"="quantityOnHand"+NEW.quantity WHERE "rawMaterialId"=NEW."rawMaterialId" AND "locationId"=NEW."locationId";
  ELSIF NEW."type" = 'CONSUMPTION' THEN
    IF NEW."productionJobId" IS NULL THEN RAISE EXCEPTION 'CONSUMPTION requires productionJobId'; END IF;
    IF cur_on < NEW.quantity THEN RAISE EXCEPTION 'Insufficient raw material: have %, need %', cur_on, NEW.quantity; END IF;
    UPDATE "RawMaterialStock" SET "quantityOnHand"="quantityOnHand"-NEW.quantity WHERE "rawMaterialId"=NEW."rawMaterialId" AND "locationId"=NEW."locationId";
  ELSIF NEW."type" = 'REVERSAL' THEN
    IF NEW."reversesId" IS NULL THEN RAISE EXCEPTION 'REVERSAL requires reversesId'; END IF;
    SELECT quantity INTO orig_qty FROM "RawMaterialLedger" WHERE id=NEW."reversesId" AND "type"='CONSUMPTION';
    IF orig_qty IS NULL THEN RAISE EXCEPTION 'reversesId must point to CONSUMPTION'; END IF;
    SELECT COALESCE(SUM(quantity),0) INTO rev_rev FROM "RawMaterialLedger" WHERE "reversesId"=NEW."reversesId" AND "type"='REVERSAL';
    IF (rev_rev + NEW.quantity) > orig_qty THEN RAISE EXCEPTION 'REVERSAL exceeds original consumption (% > %)', (rev_rev+NEW.quantity), orig_qty; END IF;
    UPDATE "RawMaterialStock" SET "quantityOnHand"="quantityOnHand"+NEW.quantity WHERE "rawMaterialId"=NEW."rawMaterialId" AND "locationId"=NEW."locationId";
  ELSIF NEW."type" = 'ADJUSTMENT' THEN
    IF NEW.reference IS NULL THEN RAISE EXCEPTION 'ADJUSTMENT requires reference'; END IF;
    IF (cur_on + NEW.quantity) < 0 THEN RAISE EXCEPTION 'ADJUSTMENT would make stock negative'; END IF;
    UPDATE "RawMaterialStock" SET "quantityOnHand"="quantityOnHand"+NEW.quantity WHERE "rawMaterialId"=NEW."rawMaterialId" AND "locationId"=NEW."locationId";
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_raw_material ON "RawMaterialLedger";
CREATE TRIGGER trg_raw_material BEFORE INSERT OR UPDATE OR DELETE ON "RawMaterialLedger" FOR EACH ROW EXECUTE FUNCTION manage_raw_material();

-- QC insertion validation
CREATE OR REPLACE FUNCTION check_qc_insert() RETURNS TRIGGER AS $$
DECLARE job_st "ProductionStatus"; u_role "RoleType";
BEGIN
  SELECT role INTO u_role FROM "User" WHERE id=NEW."changedById";
  IF u_role NOT IN ('PRODUCTION_MANAGER','SUPER_ADMIN') THEN RAISE EXCEPTION 'Unauthorized QC inspector: %', u_role; END IF;
  SELECT status INTO job_st FROM "ProductionJob" WHERE id=NEW."productionJobId" FOR UPDATE;
  IF job_st != 'QC_PENDING' THEN RAISE EXCEPTION 'QC requires job in QC_PENDING state, got %', job_st; END IF;
  IF NEW.status = 'REJECTED' AND NEW."rejectionReason" IS NULL THEN RAISE EXCEPTION 'REJECTED QC requires rejectionReason'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_qc_insert ON "ProductionQcHistory";
CREATE TRIGGER trg_qc_insert BEFORE INSERT ON "ProductionQcHistory" FOR EACH ROW EXECUTE FUNCTION check_qc_insert();

-- Production state machine
CREATE OR REPLACE FUNCTION check_production_transition() RETURNS TRIGGER AS $$
DECLARE latest "QCStatus";
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'COMPLETED' THEN RAISE EXCEPTION 'Cannot insert job as COMPLETED'; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'PENDING' AND NEW.status NOT IN ('IN_PROGRESS','CANCELLED') THEN RAISE EXCEPTION 'Invalid PENDING -> %', NEW.status; END IF;
    IF OLD.status = 'IN_PROGRESS' AND NEW.status NOT IN ('QC_PENDING','CANCELLED') THEN RAISE EXCEPTION 'Invalid IN_PROGRESS -> %', NEW.status; END IF;
    IF OLD.status = 'QC_PENDING' AND NEW.status NOT IN ('IN_PROGRESS','COMPLETED') THEN RAISE EXCEPTION 'Invalid QC_PENDING -> %', NEW.status; END IF;
    IF OLD.status = 'QC_PENDING' AND NEW.status = 'COMPLETED' THEN
      SELECT status INTO latest FROM "ProductionQcHistory" WHERE "productionJobId"=NEW.id ORDER BY "sequenceNumber" DESC LIMIT 1;
      IF latest IS NULL OR latest != 'PASSED' THEN RAISE EXCEPTION 'Cannot complete without latest PASSED QC'; END IF;
    END IF;
    IF OLD.status IN ('COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'Job immutable in state %', OLD.status; END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_production_transition ON "ProductionJob";
CREATE TRIGGER trg_production_transition BEFORE INSERT OR UPDATE ON "ProductionJob" FOR EACH ROW EXECUTE FUNCTION check_production_transition();