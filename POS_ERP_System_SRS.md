# Universal Cloud POS + ERP Platform
## Software Requirements & Technical Design Specification (SRS / FRD / BRD / TDD / DB / API / UI-UX)

**Document type:** Combined SRS, FRD, BRD, TDD, Database Design Guide, API Design Guide, UI/UX Specification
**Target platform class:** Multi-industry, multi-tenant, multi-branch Cloud POS + ERP (comparable in scope to NetSuite, SAP B1, Odoo, Zoho Inventory, Square, Toast, Lightspeed, Loyverse)
**Supported verticals:** Restaurant/Cafe/Bakery, Supermarket/Grocery, Pharmacy, Hardware, Mobile/Electronics/Appliances, Clothing/Textile/Fancy/Cosmetics/Gift retail, Wholesale, Service businesses

---

## 0. Core Design Philosophy

The single most important architectural decision in a system that must serve 20 different verticals from **one core codebase** is this:

> **Do not build 20 systems. Build ONE system with a universal data model, and make every industry difference a configuration, not a code fork.**

This is achieved through four mechanisms used throughout this document:

| Mechanism | What it does | Example |
|---|---|---|
| **Business Type / Industry Profile** | A setting on the Tenant/Branch that toggles which optional modules and fields appear | Enabling "Restaurant" turns on Tables, KOT, Recipes; enabling "Pharmacy" turns on Batch/Expiry mandatory fields |
| **Dynamic Attributes (EAV-lite)** | Product/Customer/Supplier entities carry a core fixed schema + a JSON/attribute-table extension for industry-specific fields | IMEI for phones, Expiry Date for medicine, Size/Color for clothing |
| **Feature Flags & Permission Matrix** | Every module/feature is toggleable per tenant/branch/role | A grocery store disables "Recipe Management"; a restaurant enables it |
| **Unified Transaction Engine** | Sales, Purchases, Transfers, Returns all flow through one Stock Ledger and one Accounting Ledger, regardless of industry | A "Sale" in a pharmacy and a "Dine-in Order" in a restaurant both ultimately post to `stock_ledger` and `gl_entries` |

All modules below are written against this universal core, with industry-specific extensions called out explicitly.

---

## 1. Complete Admin Sidebar — Full Module & Submenu Tree

```
📊 Dashboard
   ├─ Overview (KPIs, Sales Today, Low Stock, Pending Orders)
   ├─ Sales Analytics Widget
   ├─ Cash Position Widget
   └─ Alerts & Notifications Center

🛒 Products
   ├─ All Products
   ├─ Add/Edit Product
   ├─ Categories
   ├─ Sub-Categories
   ├─ Brands
   ├─ Units of Measure (UOM) & UOM Conversion
   ├─ Attributes (Size, Color, Flavor, etc.)
   ├─ Variants
   ├─ Combo / Bundle Products
   ├─ Recipes / Bill of Materials (BOM)
   ├─ Price Lists (Retail/Wholesale/VIP)
   ├─ Bulk Import/Export
   ├─ Barcode/QR Label Printing
   └─ Product Audit Log

📦 Inventory
   ├─ Stock Overview (by Branch/Warehouse)
   ├─ Warehouses & Branches
   ├─ Stock Adjustment
   ├─ Stock Transfer (Branch ↔ Branch, Warehouse ↔ Warehouse)
   ├─ Stock Count / Cycle Count
   ├─ Damaged / Expired / Written-off Stock
   ├─ Batch & Expiry Tracking
   ├─ Serial Number / IMEI Tracking
   ├─ Reorder Level & Auto Purchase Suggestion
   ├─ Manufacturing / Production Orders
   └─ Stock Movement Ledger (audit trail)

🧾 Purchase
   ├─ Purchase Requisitions
   ├─ Purchase Orders (PO)
   ├─ Goods Received Notes (GRN)
   ├─ Purchase Bills / Invoices
   ├─ Purchase Returns (Debit Notes)
   ├─ Supplier Payments
   └─ Approval Workflow

🏭 Suppliers
   ├─ Supplier Directory
   ├─ Supplier Ledger / Outstanding
   ├─ Payment Terms
   ├─ Contracts & Documents
   └─ Supplier Performance Ratings

💰 Sales
   ├─ POS Terminal (Sell Screen)
   ├─ Sales Orders
   ├─ Quotations / Proforma Invoice
   ├─ Sales Invoices
   ├─ Sales Returns / Refunds
   ├─ Held / Parked Sales
   ├─ Layaway / Installment Sales
   ├─ Gift Cards & Store Credit
   ├─ Coupons & Promotions
   └─ Sales Audit Log

👥 Customers / CRM
   ├─ Customer Directory
   ├─ Customer Groups / Segmentation
   ├─ Loyalty Program & Points
   ├─ Wallet / Store Credit
   ├─ Credit Limit & AR Ledger
   ├─ Marketing Campaigns (SMS/Email/WhatsApp)
   └─ Birthday/Anniversary Offers

🍽️ Restaurant / Kitchen (industry module — auto-enabled for F&B business type)
   ├─ Floor Plan & Tables
   ├─ Reservations
   ├─ Kitchen Display System (KDS)
   ├─ Kitchen Order Tickets (KOT)
   ├─ Waiter/Captain Order Assignment
   ├─ Split Bill / Merge Bill
   ├─ Combo Meals & Happy Hour Rules
   ├─ Recipe & Ingredient Consumption
   ├─ Dine-in / Takeaway / Delivery / QR Menu Orders
   └─ Delivery Rider Management

👨‍💼 Staff / HR
   ├─ Employee Directory
   ├─ Roles & Designations
   ├─ Attendance & Shift Roster
   ├─ Leave Management
   ├─ Payroll
   ├─ Commission & Incentive Rules
   └─ Performance Reviews

🧮 Finance / Accounting
   ├─ Chart of Accounts
   ├─ Journal Entries
   ├─ Cash Register / Cash Drawer (Open/Close Shift)
   ├─ Bank Accounts & Reconciliation
   ├─ Petty Cash
   ├─ Expenses
   ├─ Accounts Receivable / Payable
   ├─ Profit & Loss Statement
   ├─ Balance Sheet
   └─ Trial Balance

📈 Reports
   ├─ Sales Reports (20+)
   ├─ Inventory Reports (20+)
   ├─ Purchase Reports (10+)
   ├─ Financial Reports (15+)
   ├─ Customer/CRM Reports (10+)
   ├─ Staff Reports (10+)
   ├─ Restaurant/Kitchen Reports (10+)
   └─ Custom Report Builder

⚙️ Settings
   ├─ Company Profile & Branches
   ├─ Taxes (VAT/GST/Multi-tax)
   ├─ Currencies & Exchange Rates
   ├─ Languages / Localization
   ├─ Receipt & Invoice Templates
   ├─ Notification Channels (Email/SMS/WhatsApp/Push)
   ├─ Hardware (Printers, Scanners, Cash Drawers, Displays)
   ├─ Payment Gateway Integrations
   ├─ API Keys & Webhooks
   └─ Backup & Restore

🔐 Security
   ├─ Users & Roles (RBAC)
   ├─ Permission Matrix
   ├─ Multi-Factor Authentication (MFA)
   ├─ Login History & Device Tracking
   ├─ Session Management
   └─ Audit Trail / Activity Logs

🔌 Integrations
   ├─ Accounting (QuickBooks/Xero)
   ├─ E-commerce (Shopify/WooCommerce)
   ├─ Delivery Aggregators (Uber Eats/food delivery APIs)
   ├─ Payment Gateways (Stripe/PayHere/local banks)
   ├─ SMS/WhatsApp Gateways
   └─ Government e-Invoicing / Tax Authority APIs
```

---

## 2. Module Deep-Dive Template

Every module below follows this fixed 16-point structure so the specification stays consistent and directly buildable by a dev team.

`Purpose → Business Logic → Inputs → DB Fields → CRUD → Validation → Permissions → Relationships/Dependencies → API Endpoints → UI Components → Search/Filters → Bulk Actions → Import/Export → Audit Logs → Notifications → Status Flow → Edge Cases → Best Practices`

---

## 3. Product Management Module (Universal Product Engine)

### Purpose
A single product model that can represent a physical grocery item, a restaurant dish, a pharmacy medicine with batch/expiry, a phone with IMEI, a clothing item with size/color variants, or a service — without separate tables per industry.

### Business Logic
- Every SKU is stored once as a `product` record with a **fixed core schema** plus an **attribute extension** (`product_attributes` key-value table or JSONB column) for industry-specific fields.
- **Product Types:** `standard`, `variant_parent`, `variant_child`, `combo`, `bundle`, `service`, `digital`, `raw_material` (for recipes/manufacturing).
- **Tracking Modes** (set per product): `none`, `quantity_only`, `batch`, `serial`, `imei`. This single flag drives whether Sales/Purchase screens force batch/serial selection.
- Combo/Bundle products explode into components at time of sale for stock deduction, but bill as a single line to the customer.
- Recipes (BOM) link a sellable item (e.g., "Cappuccino") to raw-material ingredients (milk, coffee beans) with a quantity-per-unit ratio; selling one unit deducts ingredient stock automatically.
- Multi-level pricing: `cost_price`, `retail_price`, `wholesale_price`, `n` custom price tiers via `price_list_items`, resolved at sale time by customer group → branch → default, in that priority order.
- Tax is attached at the product level (tax class) but can be overridden at branch level (e.g., zero-rated exports).

### Required Inputs
Name, SKU, Barcode/QR, Category, Brand, Unit, Cost Price, Selling Price, Tax Class, Track Inventory (Y/N), Tracking Mode, Reorder Level, Images (multi), Supplier(s), Industry-specific attributes (expiry required for pharmacy/food, IMEI required for electronics, Size/Color for fashion).

### Key Database Fields
```
products
  id, tenant_id, branch_scope, sku, barcode, qr_code, name, description,
  category_id, brand_id, unit_id, product_type, tracking_mode,
  cost_price, selling_price, wholesale_price, tax_class_id,
  reorder_level, reorder_qty, is_active, has_variants, parent_id,
  created_by, created_at, updated_at, deleted_at (soft delete)

product_attributes        (product_id, attribute_key, attribute_value)
product_variants          (id, product_id, sku, barcode, attribute_set_json, price_delta, stock_qty)
product_images            (id, product_id, url, sort_order)
product_batches           (id, product_id, batch_no, expiry_date, qty, cost_price)
product_serials           (id, product_id, serial_no/imei, status, warehouse_id)
product_bom               (id, finished_product_id, ingredient_product_id, qty_per_unit, unit_id)
price_list_items          (id, price_list_id, product_id, price)
product_suppliers         (id, product_id, supplier_id, supplier_sku, cost_price, lead_time_days)
```

### CRUD Operations
- **Create:** single-product form or bulk CSV/Excel import with column mapping and dry-run validation preview.
- **Read:** paginated list with 20+ filter combinations; single product view with stock-by-branch breakdown, price history, sales velocity.
- **Update:** field-level audit logged; price changes require permission `product.price.edit`; bulk update (category/tax/price %) via multi-select.
- **Delete:** soft delete only if the product has never transacted; otherwise force-deactivate (`is_active=false`) to preserve historical reports.

### Validation Rules
- SKU/Barcode unique per tenant.
- Selling price ≥ 0; warn (not block) if selling price < cost price, unless a "loss-leader override" permission is used.
- Expiry date mandatory if `tracking_mode = batch` and industry profile = Pharmacy/Food.
- IMEI must be 15 digits and unique globally within tenant if `tracking_mode = imei`.
- Variant attribute combinations must be unique within a parent product (no duplicate Size=M/Color=Red twice).
- Combo/Bundle components must reference active, saleable products only.

### User Permissions
`product.view`, `product.create`, `product.edit`, `product.delete`, `product.price.edit`, `product.cost.view` (hides cost from cashier-level roles), `product.import`, `product.export`.

### Relationships & Dependencies
Depends on: Categories, Brands, Units, Tax Classes, Suppliers. Feeds into: Inventory (stock ledger), Sales (POS catalog), Purchase (PO lines), Reports, Recipe/Manufacturing.

### API Endpoints
```
GET    /api/v1/products?filters...
POST   /api/v1/products
GET    /api/v1/products/{id}
PUT    /api/v1/products/{id}
DELETE /api/v1/products/{id}
POST   /api/v1/products/bulk-import
GET    /api/v1/products/export
POST   /api/v1/products/{id}/variants
GET    /api/v1/products/{id}/stock-by-branch
GET    /api/v1/products/{id}/price-history
```

### UI Components
Data grid with inline-edit price/stock, image gallery uploader, variant matrix builder (Size × Color grid auto-generates SKUs), barcode label designer with print preview, category tree picker, tax-class dropdown, tabbed detail page (General / Pricing / Inventory / Variants / Suppliers / Attachments).

### Search & Filters
By name/SKU/barcode, category, brand, stock status (in stock/low/out), tracking mode, active/inactive, price range, supplier, tag.

### Bulk Actions
Bulk price update (fixed/percentage), bulk category/tax change, bulk activate/deactivate, bulk barcode print, bulk delete (soft), bulk export.

### Import/Export
CSV/Excel template with required + optional columns, image URL column, validation report before commit, downloadable error log for failed rows.

### Audit Logs
Every price, cost, and stock-related field change logged with old value, new value, user, timestamp, reason (optional note field for price changes).

### Notifications
Low stock alert to purchasing role, expiry-approaching alert (30/15/7 days configurable) to inventory manager, new product added notification to POS terminals (cache refresh push).

### Status Flow
`Draft → Active → Inactive/Discontinued` (discontinued products remain read-only for historical reporting; cannot be sold).

### Edge Cases
- Product sold in one unit but purchased in another (e.g., buy by carton, sell by piece) → handled via UOM conversion table.
- Variant deleted after being sold → soft delete keeps historical order integrity.
- Barcode collision across two products from bulk import → import blocked row-by-row, not whole batch.

### Best Practices
Always version price changes; never hard-delete a product with transaction history; enforce category before allowing "Active" status; pre-generate barcodes on save rather than relying on user-entered ones.

---

## 4. Inventory Module

### Purpose
Single source of truth for stock quantity, location, valuation, and movement history across unlimited warehouses/branches, for every industry and tracking mode.

### Business Logic
- **Stock Ledger Pattern:** every stock-affecting event (sale, purchase, transfer, adjustment, return, production, damage) writes an immutable row to `stock_ledger` with a signed quantity (+/-) and a running balance. Current stock is always `SUM(quantity_delta)` per product per warehouse — never a mutable "current stock" field alone (that field is a cached, recomputable snapshot).
- **Costing methods** supported per tenant setting: **FIFO**, **LIFO**, **Weighted Average**. The costing method determines which cost layer is consumed on a sale, which flows into COGS on the P&L.
- **Negative Stock Rule:** configurable per branch — `Block`, `Allow with Warning`, `Allow Silently`. Restaurants often allow negative stock on ingredients (recipe over-consumption); retail usually blocks.
- **Reorder Engine:** when `stock_qty ≤ reorder_level`, product is added to an auto-generated "Suggested Purchase Order" grouped by preferred supplier.
- **Stock Transfer** is a two-step process: `Dispatch` (deducts from source) → `Receive` (adds to destination), allowing an "in-transit" state and discrepancy resolution on arrival.
- **Cycle Count / Stock Count**: creates a snapshot, staff enter counted quantity, system computes variance, variance requires manager approval before posting an adjustment.
- **Manufacturing/Production Orders**: consume BOM raw materials and produce finished goods stock, with wastage % tracking.

### Required Inputs
Warehouse/branch, product, quantity, unit cost (for purchase/adjustment), batch/serial (if applicable), reason code (for adjustments/damage), reference document.

### Key Database Fields
```
warehouses          (id, tenant_id, branch_id, name, address, is_default)
stock_ledger         (id, product_id, warehouse_id, batch_id, txn_type, ref_type, ref_id,
                       qty_delta, unit_cost, running_balance, created_by, created_at)
stock_adjustments    (id, warehouse_id, reason_code, status, approved_by, notes)
stock_transfers      (id, source_warehouse_id, dest_warehouse_id, status, dispatched_at, received_at)
stock_transfer_lines (id, transfer_id, product_id, qty_sent, qty_received, variance)
stock_counts         (id, warehouse_id, status, scheduled_date, completed_at)
stock_count_lines    (id, count_id, product_id, expected_qty, counted_qty, variance)
production_orders    (id, finished_product_id, qty_to_produce, status, wastage_qty)
```

### CRUD / Validation / Permissions
CRUD is mostly create+read (ledger is append-only, never updated/deleted — corrections are posted as new reversing entries for auditability). Validation: transfer quantity ≤ available stock at source (unless negative-stock allowed); adjustment requires reason code; stock count variance beyond a configurable % threshold requires second-level (manager) approval. Permissions: `inventory.view`, `inventory.adjust`, `inventory.transfer.create`, `inventory.transfer.approve`, `inventory.count.perform`, `inventory.count.approve`.

### Relationships & Dependencies
Every Sales, Purchase, Restaurant Order, and Manufacturing transaction posts to `stock_ledger`. Feeds Finance (COGS, inventory valuation on Balance Sheet) and Reports.

### API Endpoints
```
GET  /api/v1/inventory/stock?warehouse_id&product_id
POST /api/v1/inventory/adjustments
POST /api/v1/inventory/transfers
POST /api/v1/inventory/transfers/{id}/receive
POST /api/v1/inventory/counts
POST /api/v1/inventory/counts/{id}/submit
GET  /api/v1/inventory/ledger?product_id&warehouse_id&date_range
GET  /api/v1/inventory/reorder-suggestions
```

### UI, Filters, Bulk, Import/Export, Audit, Notifications
UI: stock heatmap by warehouse, transfer wizard (pick source → destination → scan items), count sheet (mobile-friendly, barcode-scan entry). Filters: by warehouse, category, stock status, tracking mode. Bulk: bulk adjustment via CSV, bulk transfer. Import/Export: opening stock import for go-live. Audit: full ledger is the audit log by design. Notifications: low stock, transfer pending receipt, count variance flagged, expiry alerts.

### Status Flow
Transfer: `Draft → Dispatched → In Transit → Received/Partially Received → Closed`. Stock Count: `Scheduled → In Progress → Submitted → Approved/Rejected → Posted`.

### Edge Cases
Partial receipt of a transfer (breakage in transit); stock count started while a sale is in progress (lock product for counting, or reconcile after); negative stock going positive again after late purchase entry (system must back-date correctly without corrupting FIFO layers — solved by re-running valuation from the ledger, not mutating history).

### Best Practices
Never allow direct edits to a stock quantity field — always through a ledger-writing transaction; snapshot stock valuation nightly for fast reporting while keeping the ledger as ground truth; make reason codes mandatory and configurable per tenant.

---

## 5. Sales / POS Module

### Purpose
The revenue-generating front line: a fast, offline-capable sell screen plus the back-office sales documents (quotations, orders, invoices, returns) that all industries share.

### Business Logic
- **Document chain:** `Quotation → Sales Order → Invoice/Receipt → (optional) Return/Refund`. Any step can be skipped (e.g., POS retail usually jumps straight to Invoice).
- **POS Screen** must work **offline-first**: sales queue locally (IndexedDB/local SQLite) and sync when connectivity returns, using a client-generated UUID for idempotency to prevent duplicate sales on retry.
- **Pricing resolution order** at checkout: line-level manual override → active promotion/coupon → customer-group price list → branch price list → default price.
- **Multi-payment**: a single invoice can be split across Cash, Card, Wallet, Bank Transfer, Store Credit, Gift Card, and EMI, each with its own reconciliation trail into the Cash Register/Finance module.
- **Returns/Refunds** always reference the original invoice line (no orphan returns) and reverse both stock (back to inventory, unless "damaged" flagged) and revenue/tax.
- **Held/Parked Sales** let a cashier suspend a cart (common in retail queues and restaurant table service) and resume later without losing state.
- **Layaway/Installment**: customer pays a deposit, goods reserved (soft stock hold), balance due tracked as AR with a due-date schedule.

### Required Inputs
Customer (or walk-in), line items (product, qty, price, discount, tax), payment method(s), branch/register, cashier, invoice date.

### Key Database Fields
```
sales_orders     (id, tenant_id, branch_id, customer_id, status, subtotal, discount_total,
                   tax_total, grand_total, created_by, register_id, client_uuid)
sales_order_lines(id, order_id, product_id, batch_id/serial_id, qty, unit_price, discount, tax, line_total)
payments         (id, order_id, method, amount, reference_no, status)
sales_returns    (id, original_order_id, reason_code, refund_method, status)
sales_return_lines(id, return_id, order_line_id, qty_returned, restock_flag)
coupons          (id, code, discount_type, value, min_spend, usage_limit, valid_from, valid_to)
gift_cards       (id, code, balance, issued_to_customer_id, status)
```

### CRUD, Validation, Permissions
Create/Read heavy; Update restricted to `Draft`/`Quotation` state only (posted invoices are immutable — corrections go through a formal Return + new Sale, preserving audit integrity). Validation: line qty ≤ available stock (unless backorder allowed); payment total must equal grand total (or explicitly marked as credit/AR); coupon usage limits enforced server-side even if offline client allowed it optimistically (reconciled on sync). Permissions: `sales.create`, `sales.discount.apply` (capped per role, e.g., cashier max 10%, manager unlimited), `sales.void`, `sales.return.process`, `sales.price.override`.

### Relationships & Dependencies
Consumes Products & Inventory (stock deduction), Customers (loyalty/credit), Finance (revenue, tax, cash register), Promotions/Coupons, Restaurant module (for dine-in orders which are a specialized Sales Order subtype with table_id).

### API Endpoints
```
POST /api/v1/pos/sales                (idempotent via client_uuid)
GET  /api/v1/pos/sales/{id}
POST /api/v1/pos/sales/{id}/hold
POST /api/v1/pos/sales/{id}/resume
POST /api/v1/pos/sales/{id}/return
POST /api/v1/pos/sales/sync-batch      (offline queue flush)
GET  /api/v1/pos/register/{id}/shift-summary
POST /api/v1/pos/quotations
POST /api/v1/pos/quotations/{id}/convert-to-order
```

### UI, Filters, Bulk, Notifications
UI: large touch-friendly product grid + cart panel, barcode-scan input, numeric keypad, split-payment modal, receipt preview/print, hold-cart list. Filters: by date, cashier, branch, payment method, status. Bulk: none typically (transactions are per-sale); bulk-void requires manager PIN. Notifications: shift-close reminder, large-discount approval request pushed to manager device, low-stock warning at checkout.

### Status Flow
`Draft/Quotation → Confirmed Order → Invoiced/Paid → (optional) Partially Returned → Fully Returned/Voided`

### Edge Cases
Two cashiers scanning the same item from shared stock offline, then syncing (resolved by server-side stock re-validation on sync with a "stock conflict" queue for manager review); partial refund on a multi-payment invoice (refund routed to original payment method proportionally by default, overridable); tax recalculation when a return happens in a different tax period.

### Best Practices
Never allow editing a posted invoice; always tie returns to original line items; make offline sync conflict resolution visible to staff, not silent.

---

## 6. Purchase Module

**Purpose:** Manage the full procure-to-pay cycle across unlimited suppliers and warehouses.

**Business Logic:** Chain is `Requisition → Purchase Order (PO) → Goods Received Note (GRN) → Purchase Bill → Payment`. GRN is what actually moves stock (posts to `stock_ledger`); the PO is a commercial commitment only, not a stock event — this separation lets partial deliveries be received against one PO over multiple GRNs. Purchase Returns (Debit Notes) reverse both stock and the supplier's payable balance. Multi-level approval workflow: POs above a configurable threshold require secondary approval before being sent to the supplier.

**Key DB Fields:**
```
purchase_orders     (id, supplier_id, warehouse_id, status, expected_date, total_amount, approved_by)
purchase_order_lines(id, po_id, product_id, qty_ordered, unit_cost, tax)
grn                 (id, po_id, received_date, status)
grn_lines           (id, grn_id, po_line_id, qty_received, batch_no, expiry_date)
purchase_bills      (id, po_id, supplier_id, amount_due, due_date, status)
purchase_returns    (id, grn_id, reason_code, refund_or_credit_note)
```

**Validation:** GRN qty cannot exceed PO qty unless "over-receipt allowed" flag set; bill amount must reconcile against GRN value or a variance reason is required. **Permissions:** `purchase.create`, `purchase.approve`, `purchase.receive`, `purchase.pay`. **API:** `POST /api/v1/purchase-orders`, `POST /api/v1/grn`, `POST /api/v1/purchase-bills`, `POST /api/v1/purchase-returns`. **Status Flow:** `Draft → Pending Approval → Approved → Sent → Partially Received → Fully Received → Billed → Paid`. **Edge Cases:** supplier delivers different batch/expiry than ordered; currency differs from base currency (FX rate locked at PO date, revalued at payment). **Best Practice:** never let a Bill be entered without a linked GRN, to prevent phantom payables.

---

## 7. Supplier Module

**Purpose:** Central vendor master data and financial relationship tracking.

**Business Logic:** Every supplier has a running ledger (`supplier_ledger`, mirroring `stock_ledger`'s append-only pattern) driven by Purchase Bills (increase payable) and Payments (decrease payable). Payment terms (Net 30/60/COD) drive due-date calculation and an aging report (0-30/31-60/61-90/90+ days).

**Key DB Fields:** `suppliers (id, name, contact, payment_term_days, credit_limit, rating, tax_id)`, `supplier_ledger (id, supplier_id, ref_type, ref_id, debit, credit, balance)`, `supplier_documents (id, supplier_id, file_url, doc_type, expiry_date)` (for contracts/licenses).

**Permissions:** `supplier.view`, `supplier.edit`, `supplier.payment.create`. **API:** `GET /api/v1/suppliers/{id}/ledger`, `POST /api/v1/suppliers/{id}/payments`. **Edge Cases:** supplier merge (duplicate vendor entered twice) requires a ledger-preserving merge tool, not deletion. **Best Practice:** enforce a credit-limit soft-warning on new POs when nearing the supplier's own credit terms with you (if applicable), and hard-block new orders to a supplier flagged "blacklisted".

---

## 8. Customer Module / CRM

**Purpose:** Unified customer master supporting walk-in, retail member, wholesale account, and restaurant guest profiles.

**Business Logic:** Loyalty points accrue on paid invoices at a configurable rate (e.g., 1 point per $10) and can be redeemed as a payment method at POS. Store Credit/Wallet is a separate ledger from Loyalty Points (points expire/aren't cash-equivalent; wallet is real prepaid value with regulatory implications in some regions). Credit Limit customers can invoice on account; the system blocks new credit sales once `AR balance ≥ credit_limit` unless overridden by a manager. Segmentation (RFM: Recency/Frequency/Monetary) drives marketing campaign targeting and birthday/anniversary auto-offers.

**Key DB Fields:**
```
customers        (id, name, phone, email, group_id, credit_limit, tax_id)
customer_ledger   (id, customer_id, ref_type, ref_id, debit, credit, balance)   -- AR
loyalty_ledger    (id, customer_id, ref_type, points_delta, balance, expiry_date)
wallet_ledger     (id, customer_id, ref_type, amount_delta, balance)
customer_groups   (id, name, default_price_list_id, default_discount_pct)
```

**Permissions:** `customer.view`, `customer.credit.override`, `customer.loyalty.redeem`, `crm.campaign.send`. **API:** `GET /api/v1/customers/{id}/statement`, `POST /api/v1/customers/{id}/loyalty/redeem`, `POST /api/v1/crm/campaigns`. **Edge Cases:** loyalty points on a sale that is later returned (points must be clawed back proportionally); duplicate customer merge preserving ledger history. **Best Practice:** never store customer PII unencrypted; make loyalty point expiry policy explicit and disclosed.

---

## 9. Staff / HR Module

**Purpose:** Employee lifecycle, time tracking, payroll, and incentive management tied directly into POS performance data.

**Business Logic:** Attendance can be captured via POS login/logout, biometric device integration, or mobile geo-check-in. Shift roster assigns employees to branch + time-slot; POS login is restricted to the employee's scheduled shift/branch (configurable) to prevent buddy-punching and unauthorized register access. Commission rules attach to Sales (flat %, tiered by volume, or per-product-category) and are computed nightly, feeding both the Payroll module and a Staff Performance report.

**Key DB Fields:** `employees (id, name, role_id, branch_id, salary_base, hire_date)`, `attendance (id, employee_id, clock_in, clock_out, branch_id, method)`, `payroll_runs (id, period_start, period_end, status)`, `payslips (id, payroll_run_id, employee_id, gross, deductions, net)`, `commission_rules (id, role_id/product_category_id, rate_type, rate_value)`.

**Permissions:** `hr.employee.manage`, `hr.payroll.process`, `hr.payroll.approve`, `hr.attendance.edit`. **API:** `POST /api/v1/hr/attendance/clock-in`, `POST /api/v1/hr/payroll/runs`, `GET /api/v1/hr/employees/{id}/commission-summary`. **Status Flow (Payroll):** `Draft → Calculated → Approved → Paid`. **Edge Cases:** mid-month salary revision (pro-rated); employee working across two branches in one pay period (attendance aggregated across branch_id). **Best Practice:** payroll approval must be a distinct role from payroll preparation (segregation of duties).

---

## 10. Restaurant / Kitchen Module (Vertical Extension)

**Purpose:** Adds dine-in/table service, kitchen production, and food-specific workflows on top of the universal Sales engine — auto-enabled when a branch's Industry Profile = Restaurant/Cafe/Bakery.

**Business Logic:**
- A **Table Order** is a Sales Order with `table_id` + `status=open` that stays editable (add/remove items) across multiple KOT prints until final bill/close — unlike retail POS where invoices are immutable once posted.
- **Kitchen Order Ticket (KOT):** each new item sent to kitchen generates a ticket routed to the correct **Kitchen Display System (KDS)** station (grill, bar, dessert) based on product's `kitchen_station` attribute; ticket lifecycle `Sent → Preparing → Ready → Served`.
- **Recipe/BOM consumption:** selling a dish deducts raw-material ingredient stock per the BOM ratio (see Product module §3), enabling real ingredient-level inventory and food-cost % reporting.
- **Split Bill:** one table order splits into N sub-invoices (by item, by seat, or evenly) at payment time — each sub-invoice is its own payment/receipt but shares the parent order for reporting.
- **Merge Orders:** two open tables can merge into one bill (common when guests combine tables) — reference integrity keeps original table history intact.
- **Order channels:** Dine-in, Takeaway, Delivery, and QR-code self-order menu all create the same underlying Sales Order type, differentiated by a `channel` field, so reporting is unified.
- **Happy Hour / Combo Meal pricing:** time-window and day-of-week based price rules evaluated at the moment an item is added to cart, not at checkout, so the customer sees the discounted price immediately.

**Key DB Fields:**
```
restaurant_tables   (id, branch_id, name, capacity, zone, status: free/occupied/reserved)
reservations        (id, table_id, customer_id, party_size, reserved_at, status)
kitchen_tickets     (id, order_id, station, status, sent_at, ready_at)
order_channel_field  → sales_orders.channel: dine_in | takeaway | delivery | qr_online
delivery_riders     (id, name, status, current_order_id)
```

**Permissions:** `restaurant.table.manage`, `restaurant.kot.void`, `restaurant.bill.split`, `restaurant.order.merge`. **API:** `POST /api/v1/restaurant/tables/{id}/open-order`, `POST /api/v1/restaurant/orders/{id}/send-kot`, `POST /api/v1/restaurant/orders/{id}/split-bill`, `GET /api/v1/restaurant/kds/{station}/tickets`. **Status Flow (Table):** `Free → Reserved/Occupied → Order Open → Bill Requested → Paid → Free`. **Edge Cases:** item 86'd (out of stock) mid-service must instantly disable it on all QR-menu and POS screens; KOT reprint after kitchen loses a ticket (must flag as "reprint" not a duplicate order). **Best Practice:** never let a "Paid" table order be edited — force a formal void/return; keep KDS latency under 2 seconds via WebSocket push, not polling.

---

## 11. Reports Module

**Purpose:** Give every role the numbers they need, filtered, exportable, and scheduled.

**Design principle:** Reports are generated from **materialized/denormalized reporting tables** refreshed on a schedule (or real-time via change-data-capture for critical dashboards), never by querying the live transactional `stock_ledger`/`sales_order_lines` directly at scale — this keeps POS performance unaffected by heavy reporting queries.

**Representative report catalog (100+ total; grouped):**

| Category | Example Reports |
|---|---|
| Sales | Sales by Day/Cashier/Branch/Product/Category, Hourly Sales Heatmap, Discount Given, Void/Refund Report, Payment Method Breakdown, Gross Margin by Item |
| Inventory | Stock on Hand, Stock Valuation (FIFO/Avg), Low Stock, Expiry Report, Slow/Fast Moving Items, Stock Aging, Transfer Log, Damaged Stock Summary |
| Purchase | PO Status, Supplier Purchase History, Pending GRNs, Purchase vs Budget |
| Financial | P&L, Balance Sheet, Trial Balance, Cash Flow, Tax Liability (VAT/GST Return), Expense by Category |
| Customer/CRM | Top Customers, Loyalty Point Liability, AR Aging, Customer Retention/Churn |
| Staff | Sales by Employee, Attendance Summary, Commission Payout, Overtime Report |
| Restaurant | Food Cost %, Table Turnover Time, Item-wise Kitchen Performance, Void/Comp Report |
| Dashboard KPIs | Today's Sales vs Yesterday/Last Week, Top 10 Products, Cash-in-Drawer, Pending Approvals |

**Every report supports:** date-range filter, branch/warehouse filter, group-by, export (PDF/Excel/CSV), schedule-and-email, and drill-down from summary → transaction detail. **Permissions:** report visibility is role-gated (e.g., cashiers cannot see Cost/Margin reports). **Best Practice:** every report must be reproducible for a past date even after price/cost-method changes, by reading from immutable ledgers, not current-state fields.

---

## 12. Finance / Accounting Module

**Purpose:** A full double-entry general ledger underneath every POS/Inventory/Purchase transaction, so the system is audit-grade, not just a stock-counter.

**Business Logic:** Every business transaction auto-generates balanced journal entries behind the scenes (e.g., a Sale debits Cash/AR and credits Revenue + Tax Payable, and simultaneously debits COGS / credits Inventory). Users never need to manually journal routine sales — only adjustments, accruals, and corrections are manual. **Cash Register / Drawer:** each POS shift has an `Open Shift` (starting float) and `Close Shift` (counted cash vs expected cash, variance logged) — this is the reconciliation bridge between POS cash sales and the bank/cash GL account.

**Key DB Fields:**
```
chart_of_accounts  (id, code, name, type: asset/liability/equity/income/expense, parent_id)
journal_entries    (id, ref_type, ref_id, date, status)
journal_lines      (id, journal_id, account_id, debit, credit)
cash_shifts        (id, register_id, opened_by, opening_float, closed_by, expected_cash, counted_cash, variance)
expenses           (id, category_id, amount, branch_id, approved_by)
```

**Permissions:** `finance.journal.post`, `finance.reports.view`, `finance.shift.close`, `finance.reconcile`. **API:** `POST /api/v1/finance/journal-entries`, `POST /api/v1/pos/register/{id}/close-shift`, `GET /api/v1/finance/reports/pl?period=`. **Status Flow (Shift):** `Opened → Active → Closing (count entered) → Closed/Reconciled`. **Edge Cases:** shift left open overnight (auto-flag for manager review); multi-currency cash drawer. **Best Practice:** journal entries are never edited once posted — reversing entries only, full double-entry balance enforced at the database constraint level, not just application logic.

---

## 13. Settings Module

Company profile & multi-branch config, tax rules (supports compound/multi-tax per region), currency & FX rates, language/localization (RTL support where needed), receipt/invoice template designer (drag-drop with variables like {customer_name}, {loyalty_points}), notification channel setup (SMS/Email/WhatsApp provider API keys), hardware setup (thermal printer, barcode scanner, customer-facing display, cash drawer kick), payment gateway credentials (stored encrypted, never shown again after entry), API key management with scoped permissions, and scheduled automated backups with one-click restore and a dry-run restore-verification option.

## 14. Security Module

Role-Based Access Control (RBAC) with a full permission matrix (module × action × role), custom role creation beyond the defaults (Owner/Manager/Cashier/Kitchen/Accountant), mandatory MFA for Owner/Admin roles and optional for others, login history with device fingerprint + IP + geolocation, active session management with remote "log out this device," and a tamper-evident audit trail (every create/update/delete across the system logged with before/after values, immutable/append-only, exportable for compliance). Sensitive fields (payment credentials, customer PII, cost prices for restricted roles) are encrypted at rest and masked in the UI based on permission.

## 15. Multi-Tenant Architecture

**Tenant Isolation:** every table carries a `tenant_id`; enforced not just in application queries but at the database layer via Row-Level Security (RLS) policies, so a bug in application code cannot leak cross-tenant data. **Branch Isolation:** a second-level scoping (`branch_id`) within a tenant, with role permissions optionally restricted to specific branches. **Database Strategy:** shared database with RLS for small/mid tenants (cost-efficient, easy to patch/upgrade); dedicated schema-per-tenant or database-per-tenant offered as an "Enterprise" tier for large customers needing stronger isolation or data-residency guarantees. **Scaling Strategy:** stateless application layer horizontally scaled behind a load balancer; read replicas for reporting queries; the stock/sales ledger tables partitioned by tenant_id + date range as volume grows. **API Architecture:** REST (or GraphQL for complex nested reads) behind an API gateway handling auth, rate-limiting per tenant, and request routing. **Caching:** Redis for product catalog/price-list caching (POS terminals pull a versioned catalog snapshot, invalidated on product change) and session storage. **Queue System:** message queue (e.g., SQS/RabbitMQ/Kafka) for async work — offline-sale sync processing, receipt/report generation, notification dispatch, webhook delivery — decoupled from the request/response cycle. **Microservices vs Modular Monolith:** recommend starting as a **modular monolith** with clear module boundaries (Products, Sales, Inventory, Finance as internal modules with well-defined interfaces) — this is dramatically faster to build and operate at MVP/early-scale stage; extract a module into its own microservice only when it has a genuinely different scaling profile (e.g., Reporting/Analytics, or the offline-sync ingestion pipeline). **Deployment:** containerized (Docker/Kubernetes), blue-green or canary deployments, tenant-aware feature flags for gradual rollout.

---

## 16. Database Design Guide

### Design Principles
1. **Append-only ledgers for anything financial or stock-related** (`stock_ledger`, `journal_lines`, `customer_ledger`, `supplier_ledger`, `loyalty_ledger`) — corrections are reversing entries, never UPDATE/DELETE, giving a perfect audit trail for free.
2. **Soft deletes everywhere** (`deleted_at` timestamp) on master data (products, customers, suppliers) so historical documents referencing them never break.
3. **Every table** carries `tenant_id`, `created_at`, `updated_at`, `created_by`; transactional tables also carry `branch_id`.
4. **3NF normalization** for master data (Products, Customers, Suppliers, Categories) to avoid update anomalies; **controlled denormalization** for reporting tables (materialized views/summary tables refreshed on schedule) for read performance at scale.
5. **Composite indexes** on the columns every module filters by: `(tenant_id, branch_id, created_at)` on all transaction tables; `(tenant_id, sku)` unique on products; `(tenant_id, barcode)` unique.

### Core Entity-Relationship Overview (ASCII)
```
tenants ─┬─< branches ─┬─< warehouses
         │              ├─< registers (POS terminals)
         │              └─< employees
         │
         ├─< products ─┬─< product_variants
         │              ├─< product_batches
         │              ├─< product_serials
         │              └─< product_bom
         │
         ├─< customers ─┬─< customer_ledger (AR)
         │               ├─< loyalty_ledger
         │               └─< wallet_ledger
         │
         ├─< suppliers ──< supplier_ledger
         │
         ├─< sales_orders ─┬─< sales_order_lines ──> products
         │                  ├─< payments
         │                  └─< sales_returns
         │
         ├─< purchase_orders ─┬─< purchase_order_lines ──> products
         │                     ├─< grn ──< grn_lines
         │                     └─< purchase_bills
         │
         ├─< stock_ledger  (product_id, warehouse_id, ref_type, ref_id, qty_delta)
         │
         └─< chart_of_accounts ──< journal_entries ──< journal_lines
```

### Table Categories
| Category | Examples | Delete Policy |
|---|---|---|
| **Master (rarely change)** | tenants, branches, categories, units, tax_classes | Soft delete |
| **Reference/Config** | payment_methods, reason_codes, price_lists | Soft delete |
| **Transactional (append-only)** | sales_orders, purchase_orders, stock_ledger, journal_entries | Never delete; reverse |
| **History/Audit** | audit_logs, login_history, product_price_history | Never delete; retention-policy archive |
| **Cached/Derived** | daily_sales_summary, stock_snapshot | Rebuildable — safe to truncate & regenerate |

### Constraints & Integrity
Foreign keys enforced at DB level (not just app-level) between transaction lines and master data; `CHECK` constraints for non-negative quantities/prices where applicable; unique constraints scoped by `tenant_id` (e.g., `UNIQUE(tenant_id, sku)`); database-level triggers or application transactions ensure `journal_lines` always balance (SUM(debit) = SUM(credit)) before commit.

---

## 17. UI/UX Design Specification

**Layout:** persistent left sidebar (collapsible icon-only mode) mirroring the module tree in §1; top bar with branch switcher, global search (product/customer/order), notification bell, and user menu. **Dashboard:** widget-grid (drag-to-rearrange) with KPI cards, a sales trend line chart, a low-stock table, and a "pending approvals" action list.

**Forms:** multi-tab detail pages for complex entities (Product, Customer, Employee) to avoid one giant scroll; inline validation with field-level error messages; autosave draft state for long forms.

**Tables/Data Grids:** sticky header, column show/hide picker, saved filter views per user, inline quick-edit for common fields (price, stock), row-level action menu, bulk-select checkbox with a floating bulk-action bar.

**POS Sell Screen (separate, kiosk-optimized layout, not the admin shell):** large touch targets (min 44px), category tabs across the top, product grid center, cart panel right (or bottom on mobile), numeric keypad, prominent payment button, offline-status indicator always visible.

**Mobile Responsiveness:** admin panel collapses sidebar to a bottom nav or hamburger drawer below 768px; data grids convert to stacked cards on mobile; POS and KDS screens are designed mobile/tablet-first since they run on handheld hardware in the field.

**Charts:** consistent color system across all reports (one hue per metric type — revenue, cost, tax), tooltips with exact values, empty-state illustrations rather than blank charts.

**Accessibility:** WCAG AA color contrast, keyboard navigation for all admin forms, screen-reader labels on icon-only buttons.

---

## 18. Development Roadmap

### Phase 1 — MVP (Core Retail POS)
Products (standard + variants), Basic Inventory (single warehouse, quantity-only tracking), Sales/POS (cash+card), Customers (basic), Suppliers, Purchase (PO→GRN→Bill), basic Reports (sales, stock), Settings (company/tax/receipt), Security (RBAC basics). **Goal:** a sellable single-branch retail POS.

### Phase 2 — Multi-Branch & Industry Verticals
Multi-branch/multi-warehouse, Stock Transfer, Batch/Expiry/Serial/IMEI tracking, Restaurant module (Tables/KOT/KDS), CRM (Loyalty/Wallet/Segmentation), Finance/Accounting full GL, HR/Payroll, advanced Reports (100+), Offline-first POS sync.

### Phase 3 — Enterprise & Scale
Multi-tenant self-service onboarding, multi-currency, advanced approval workflows, e-commerce/delivery-aggregator integrations, custom report builder, API/webhook platform for third-party developers, white-label/reseller support, data-residency/dedicated-tenant tier.

### Future — AI Features
Demand forecasting & auto-reorder suggestions, anomaly detection on cash/stock variances (shrinkage detection), AI-assisted product categorization from images, natural-language report queries, dynamic pricing suggestions, churn-prediction for CRM campaigns.

### Priority Matrix (illustrative)
| Feature | Business Value | Effort | Priority |
|---|---|---|---|
| POS Sell Screen + Offline Sync | High | High | P0 |
| Product + Inventory Core | High | Medium | P0 |
| Purchase Cycle | High | Medium | P0 |
| Restaurant KOT/KDS | High (for F&B tenants) | High | P1 |
| Full Accounting GL | Medium-High | High | P1 |
| Multi-Tenant RLS/Isolation | High (for SaaS model) | High | P1 |
| Custom Report Builder | Medium | High | P2 |
| AI Forecasting | Medium | High | P3 |

### Risk Analysis
Offline-sync conflict resolution is the highest-risk technical area (data integrity across unreliable networks) — mitigate with idempotent client UUIDs and a visible conflict-review queue. Multi-industry scope creep is the highest-risk product area — mitigate by keeping industry differences as configuration (attributes/feature-flags), never as forked code paths, per §0.

### Testing Strategy
Unit tests on all pricing/tax/costing calculation logic (these are the most audit-sensitive); integration tests on the full document chains (PO→GRN→Bill, Order→Invoice→Return); load testing on the stock ledger and POS sync endpoints; UAT with real pilot merchants per vertical (at least one restaurant, one pharmacy, one retail store) before GA.

### Deployment Strategy
Staged rollout: internal dogfood → closed beta (3-5 pilot merchants per vertical) → open beta → GA, with feature flags allowing per-tenant rollback of any module without a full deployment rollback.

---

*End of specification. This document is intended as a living artifact — update module sections as detailed engineering design (API contracts, exact field lists) is finalized during each development phase.*
