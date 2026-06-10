# x-lab — Orders & Checkout (OMS)

Turns the client-side checkout simulation (`generateReceiptManifest`) into persisted
orders with stock control and an admin fulfillment workflow.

## OMS decisions (locked)

| Axis | Choice |
|---|---|
| Payments | **None** — checkout captures the order; admin marks paid/fulfilled manually. (Stripe deferred.) |
| Customers | **Guest checkout + optional account** — buy as guest (email + shipping); optionally create an account to view order history |
| Inventory | **Tracked** — `products.stock_quantity`, decremented atomically at checkout; oversell blocked; sold-out states shown |
| Notifications | **None in v1** — admin sees orders in the portal; on-screen confirmation only |

Canonical schema for `orders`, `order_items`, `customers`, and the `products` stock
columns lives in `data-model.md`. This file is the behavioral spec.

## Identities (see `auth-rbac.md`)

- **Staff** (`admin`/`editor`) — manage orders in the portal. A `users` row with that role.
- **Customer** — optional account (Auth.js): a `users` row with `role='customer'` linked
  1:1 to a `customers` row. NOT staff.
- **Guest** — no account; identified by the email captured on the order. A `customers`
  row is still find-or-created by email (`user_id` null) so order history can attach later
  if they register.

## Order lifecycle

```
pending ──mark paid──► paid ──► processing ──► shipped ──► delivered
   │                    │
   └────────── cancelled ◄────────┘            paid/processing ──refund──► refunded
```

`order_status` enum: `pending | paid | processing | shipped | delivered | cancelled | refunded`.

- New orders start `pending` (no payment captured).
- **Cancel** (`pending`/`paid`/`processing`) and **refund** (`paid`/`processing`/`shipped`)
  are terminal and **restock** their line items (reverse the decrement).
- `delivered` is terminal (success). Status changes stamp `paid_at` / `shipped_at` /
  `cancelled_at` accordingly.
- Guard illegal transitions in the handler (e.g. can't ship a cancelled order) → `409`.

## Stock rules

- `products.stock_quantity` (int, ≥0) is the source of truth; `allow_backorder boolean`
  (default false) lets a product sell past zero.
- A product is **sold out** when `stock_quantity <= 0 AND NOT allow_backorder`.
- Checkout decrements stock **atomically inside the `create_order` RPC** (below). If any
  line can't be satisfied, the whole order fails (`409 insufficient_stock`) — no partial
  orders, no oversell.
- Cancel/refund **restocks** the line quantities.

## `create_order` RPC (atomic checkout)

Mirrors ANKA's `win_deal()` stored-procedure pattern: one transactional, `security definer`
Postgres function so a public (anon) caller can place an order without direct write access
to `orders`. The public `POST /api/checkout` route calls it via `supabase.rpc('create_order', …)`.

```
create_order(p_payload jsonb) returns orders
  -- p_payload: { customer:{email,fullName,phone}, shipping:{…}, note, items:[{productId, quantity}] }
  1. Validate items non-empty; quantities > 0.
  2. find-or-create customers row by lower(email); capture customer_id.
  3. FOR each item:
       update products
         set stock_quantity = stock_quantity - qty
         where id = productId and (stock_quantity >= qty or allow_backorder)
         returning title, price;
       if NOT FOUND -> raise exception 'insufficient_stock:<productId>';
  4. insert orders (customer_id, contact + shipping snapshot, shipping_fee=15.00,
     subtotal=sum(price*qty)); total is a GENERATED column.
  5. insert order_items with product_title + unit_price SNAPSHOTS (history-stable).
  6. return the order row.
```

- `order_number` comes from `order_number_seq` → `'LAB-' || nextval` (e.g. `LAB-100001`).
- Snapshots (`order_items.product_title`, `unit_price`) keep historical orders correct even
  if the product is later edited or deleted (`product_id` is `SET NULL` on delete).
- `orders.total` and `order_items.line_total` are **GENERATED** columns — never set from app
  code (same rule as ANKA `invoices.total`).

## API

Detailed shapes in `api.md`; summary here.

### Public — `POST /api/checkout`
- Body: `{ items:[{productId, quantity}], customer:{email, fullName, phone}, shipping:{line1,line2,city,region,postal,country}, note? }`.
- Validates with `lib/schemas/checkout.ts` (zod), then `rpc('create_order', …)`.
- **201**: `{ data: { orderNumber, status:'pending', subtotal, shippingFee, total, items:[…] } }`.
- Errors: `422` validation; `409 insufficient_stock` (include offending `productId`s);
  `404` unknown product.
- Public write → **rate-limit** (e.g. per-IP) and require all contact/shipping fields.
  Not cached (`dynamic`).

### Admin — `/api/admin/orders*` (staff: editor+)
```
GET    /api/admin/orders          list; ?status=&search=(email|order_number)&from=&to=
GET    /api/admin/orders/[id]     order + items + customer + shipping
PATCH  /api/admin/orders/[id]     { status } transition; stamps timestamp; restocks on cancel/refund
```
No create/delete from admin in v1 (orders originate from checkout). Transition validation
per the lifecycle above.

### Customer account (optional) — `/api/account/*`
```
POST /api/account/register        create a users row (role customer) + link/insert customers row by email
GET  /api/account/orders          orders for the logged-in customer (by customer_id)
```
Optional in v1; guest checkout works without any of this.

## RLS (see `auth-rbac.md` for full SQL)

Auth is Auth.js (not Supabase Auth), so access is **server-enforced**, not RLS-by-user
(see `auth-rbac.md`). `orders`, `order_items`, `customers` have **no anon policy** —
reachable only via the service-role client server-side:
- **Writes:** orders are created only by `create_order` (called server-side from
  `/api/checkout`); status updates by staff handlers (`admin`/`editor`; cancel/refund admin).
- **Reads:** staff handlers read all; a logged-in customer reads only their own — the
  `/api/account/orders` route resolves `customers.id` from the Auth.js session (`user_id`)
  and queries with the service-role client filtered by that `customer_id`.

## Admin portal (see `admin-portal.md`)

- **`/admin/orders`** — table: order #, date, customer (email/name), items, total, status
  badge; filter by status, search, date range.
- **`/admin/orders/[id]`** — customer + shipping, line items (title/qty/unit/line total),
  subtotal/shipping/total, status control with valid transitions, timestamps, customer note.
- **Stock** surfaces in the **product form** (`stock_quantity`, `allow_backorder`, low-stock
  hint) and as a column in the product list.
- **Dashboard** gains: new/pending order count and captured-revenue total.
- Permissions: `editor+` may view and progress fulfillment; **cancel/refund is admin-only**
  (it moves money/stock conceptually). Tighten further if desired.

## Frontend / checkout flow (see `frontend-integration.md`)

- The cart's **`INITIALIZE_SECURE_CHECKOUT`** button now opens a **checkout form** (email,
  full name, phone, shipping address, optional note) instead of immediately faking a receipt.
- Submit → `POST /api/checkout` → on `201`, render the existing receipt-style confirmation
  **populated from the real order** (`orderNumber`, `total`, line items) and clear the cart.
  `generateReceiptManifest` is repurposed to format the real response, preserving the
  Neo-Brutalist receipt aesthetic.
- **Sold-out states:** the storefront payload exposes `soldOut` (and optional `stock`) per
  product; sold-out products show a `SOLD OUT` badge and disable "add to cart". Quantity in
  the cart can't exceed available stock.
- **Optional account:** after checkout, offer "create an account to track this order";
  customer login (Auth.js) shows `/account/orders`. Entirely optional.

## Out of scope (v1)

Real payments (Stripe), shipping-rate calculation, taxes, partial fulfillment / split
shipments, returns workflow beyond a single `refunded` status, customer email notifications.
