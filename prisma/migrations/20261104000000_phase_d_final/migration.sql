-- 1. PRE-MIGRATION & SCHEMA UPDATES
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
ALTER TABLE "Product" ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';

-- 2. ENUMS
CREATE TYPE "LocationType" AS ENUM ('CENTRAL_WAREHOUSE', 'SHOWROOM');
CREATE TYPE "FulfillmentType" AS ENUM ('READY_STOCK', 'MADE_TO_ORDER');
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'AWAITING_QUOTE', 'AWAITING_BALANCE', 'READY_FOR_DISPATCH', 'DISPATCHED', 'CANCELLED');
CREATE TYPE "ObligationType" AS ENUM ('DEPOSIT', 'PRODUCT_BALANCE', 'DELIVERY_CHARGE');
CREATE TYPE "ObligationStatus" AS ENUM ('PENDING', 'PAID', 'VOID');
CREATE TYPE "LedgerTransactionType" AS ENUM ('PAYMENT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'TRANSFER_OUT', 'TRANSFER_IN', 'RESERVATION', 'DISPATCH', 'CANCELLATION', 'RESTOCK', 'ADJUSTMENT', 'OPENING_BALANCE');
CREATE TYPE "StockLedgerStatus" AS ENUM ('ACTIVE', 'FULFILLED', 'CANCELLED');
CREATE TYPE "RawMaterialMovementType" AS ENUM ('RECEIPT', 'CONSUMPTION', 'REVERSAL', 'ADJUSTMENT');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSED', 'REJECTED');
CREATE TYPE "ProductionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'QC_PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "QCStatus" AS ENUM ('PASSED', 'REJECTED');
CREATE TYPE "DeliveryQuoteStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUPERSEDED');
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- 3. TABLES
CREATE TABLE "PaymentObligation" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" TEXT NOT NULL,
    "fulfillmentGroupId" TEXT NOT NULL,
    "type" "ObligationType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "status" "ObligationStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryQuoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentObligation_key" UNIQUE ("id", "orderId")
);

CREATE TABLE "DeliveryQuote" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "fulfillmentGroupId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "amount" BIGINT NOT NULL,
    "status" "DeliveryQuoteStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryQuote_key_group_version" UNIQUE ("fulfillmentGroupId", "version"),
    CONSTRAINT "DeliveryQuote_key_id_group" UNIQUE ("id", "fulfillmentGroupId") 
);

-- 4. COMPOSITE FOREIGN KEYS
ALTER TABLE "PaymentObligation" ADD CONSTRAINT "PaymentObligation_deliveryQuoteId_fkey" 
FOREIGN KEY ("deliveryQuoteId", "fulfillmentGroupId") REFERENCES "DeliveryQuote"("id", "fulfillmentGroupId");

-- 5. STRICT INVENTORY STATE MACHINE
CREATE OR REPLACE FUNCTION manage_inventory_lifecycle() RETURNS TRIGGER AS $$
DECLARE 
    current_onhand INT;
    current_reserved INT;
BEGIN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'StockLedger is append-only.'; END IF;
    
    IF TG_OP = 'INSERT' THEN
        IF NEW.quantity = 0 THEN RAISE EXCEPTION 'Quantity cannot be zero.'; END IF;
        IF NEW.type = 'DISPATCH' THEN RAISE EXCEPTION 'Direct dispatch prohibited. Use fulfillment.'; END IF;
        IF NEW.type != 'OPENING_BALANCE' AND NEW.status != 'ACTIVE' THEN RAISE EXCEPTION 'New entries must be ACTIVE.'; END IF;

        IF NEW.type IN ('RECEIPT', 'TRANSFER_IN', 'RESTOCK') AND NEW.quantity < 0 THEN RAISE EXCEPTION 'Invalid sign.'; END IF;
        IF NEW.type IN ('TRANSFER_OUT') AND NEW.quantity > 0 THEN RAISE EXCEPTION 'Invalid sign.'; END IF;
        IF NEW.type = 'RESERVATION' AND NEW.quantity > 0 THEN RAISE EXCEPTION 'Reservation must be negative.'; END IF;
        
        INSERT INTO "InventoryStock" ("id", "variantId", "locationId") VALUES (gen_random_uuid(), NEW."variantId", NEW."locationId") ON CONFLICT DO NOTHING;
        SELECT "quantityOnHand", "quantityReserved" INTO current_onhand, current_reserved FROM "InventoryStock" WHERE "variantId" = NEW."variantId" AND "locationId" = NEW."locationId" FOR UPDATE;

        IF NEW.type = 'RESERVATION' THEN
            IF (current_onhand - current_reserved) < ABS(NEW.quantity) THEN RAISE EXCEPTION 'Insufficient available stock.'; END IF;
            UPDATE "InventoryStock" SET "quantityReserved" = "quantityReserved" + ABS(NEW.quantity) WHERE "variantId" = NEW."variantId" AND "locationId" = NEW."locationId";
        ELSIF NEW.type IN ('RECEIPT', 'TRANSFER_IN', 'RESTOCK', 'TRANSFER_OUT', 'ADJUSTMENT') THEN
            UPDATE "InventoryStock" SET "quantityOnHand" = "quantityOnHand" + NEW.quantity WHERE "variantId" = NEW."variantId" AND "locationId" = NEW."locationId";
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.variantId != NEW.variantId OR OLD.quantity != NEW.quantity OR OLD.type != NEW.type OR OLD.locationId != NEW.locationId OR OLD.orderItemId IS DISTINCT FROM NEW.orderItemId OR OLD.reference != NEW.reference OR OLD.createdAt != NEW.createdAt THEN RAISE EXCEPTION 'Identity fields cannot be mutated.'; END IF;
        IF OLD.type != 'RESERVATION' THEN RAISE EXCEPTION 'Only reservations can change lifecycle status.'; END IF;
        IF OLD.status = 'CANCELLED' THEN RAISE EXCEPTION 'Cancelled reservations cannot be reactivated.'; END IF;

        IF OLD.status = 'ACTIVE' AND NEW.status = 'CANCELLED' THEN
            UPDATE "InventoryStock" SET "quantityReserved" = "quantityReserved" - ABS(NEW.quantity) WHERE "variantId" = NEW."variantId" AND "locationId" = NEW."locationId";
        ELSIF OLD.status = 'ACTIVE' AND NEW.status = 'FULFILLED' THEN
            UPDATE "InventoryStock" SET "quantityReserved" = "quantityReserved" - ABS(NEW.quantity), "quantityOnHand" = "quantityOnHand" - ABS(NEW.quantity) WHERE "variantId" = NEW."variantId" AND "locationId" = NEW."locationId";
        ELSE
            RAISE EXCEPTION 'Invalid status transition.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_inventory BEFORE INSERT OR UPDATE OR DELETE ON "StockLedger" FOR EACH ROW EXECUTE FUNCTION manage_inventory_lifecycle();

-- 6. STRICT DISPATCH GUARD
CREATE OR REPLACE FUNCTION check_dispatch_guard() RETURNS TRIGGER AS $$
DECLARE 
    missing_obligations INT;
    unpaid_obligations INT;
BEGIN
    IF NEW.status = 'DISPATCHED' AND (TG_OP = 'INSERT' OR OLD.status != 'DISPATCHED') THEN
        IF NOT EXISTS (SELECT 1 FROM "Delivery" WHERE "fulfillmentGroupId" = NEW.id) THEN RAISE EXCEPTION 'Delivery record missing.'; END IF;

        SELECT COUNT(*) INTO missing_obligations 
        FROM (SELECT 'PRODUCT_BALANCE' as type UNION ALL SELECT 'DELIVERY_CHARGE') req
        WHERE NOT EXISTS (
            SELECT 1 FROM "PaymentObligation" po 
            WHERE po."fulfillmentGroupId" = NEW.id AND po.type = req.type AND po.status != 'VOID' AND po.amount > 0
        );
        IF missing_obligations > 0 THEN RAISE EXCEPTION 'Required obligations are missing.'; END IF;

        SELECT COUNT(*) INTO unpaid_obligations 
        FROM "PaymentObligation" po
        WHERE po."fulfillmentGroupId" = NEW.id AND po.type IN ('PRODUCT_BALANCE', 'DELIVERY_CHARGE') AND po.status != 'VOID' AND po.amount > 0
        AND (SELECT COALESCE(SUM(pa.amount), 0) FROM "PaymentAllocation" pa JOIN "FinancialLedger" fl ON pa."ledgerId" = fl.id WHERE pa."obligationId" = po.id AND fl.type = 'PAYMENT') < po.amount;
        
        IF unpaid_obligations > 0 THEN RAISE EXCEPTION 'Unpaid obligations exist.'; END IF;
        UPDATE "Delivery" SET status = 'DISPATCHED' WHERE "fulfillmentGroupId" = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_dispatch_guard BEFORE INSERT OR UPDATE ON "FulfillmentGroup" FOR EACH ROW EXECUTE FUNCTION check_dispatch_guard();