-- =====================================================================
--  Batloung Fruits — EXTRA Seed Data (run AFTER seed.sql)
--  Extends dataset to December 2026 & January 2027
--  Adds 2 more vendors, 12 more orders, 10 more purchases
-- =====================================================================
USE batloung_fruits;

-- =====================================================================
-- Extra Street Vendors (vendors 15-16)
-- =====================================================================
INSERT INTO street_vendors (name, business_name, telephone, location, registration_date, status) VALUES
 ('Tlotliso Makhoali',  'Tlotliso Fresh Corner',   '+266 5801 5555', 'Maseru CBD',       '2026-10-01', 'Active'),
 ('Refiloe Setipa',     'Refiloe Sunrise Stall',    '+266 5801 6666', 'Lancer\'s Gap',     '2026-10-15', 'Active');

-- =====================================================================
-- Extra Purchases — December 2026
-- =====================================================================
INSERT INTO purchases (supplier_id, product_id, quantity, unit_cost, purchase_date) VALUES
 (1,  1,  65, 26.00, '2026-12-01'),  -- Cape Orchard, Apples Small
 (3,  10, 40, 35.00, '2026-12-02'),  -- Limpopo Tropical, Mangoes Small
 (4,  5,  50, 44.00, '2026-12-03'),  -- KZN Bananas, Bananas Medium
 (6,  15, 18, 118.00,'2026-12-05'),  -- Northern Cape Vines, Grapes Large
 (10, 25, 20, 50.00, '2026-12-07'),  -- Cape Berry Farms, Strawberries Small
 (12, 31, 25, 65.00, '2026-12-09'),  -- Highveld Stone Fruits, Peaches Small
 (5,  2,  35, 50.00, '2026-12-10'),  -- Mpumalanga Fresh, Apples Medium
 (7,  8,  30, 47.00, '2026-12-12'),  -- Eastern Cape Citrus, Oranges Medium
 (3,  11, 28, 58.00, '2026-12-14'),  -- Limpopo Tropical, Mangoes Medium
 (9,  4,  60, 20.00, '2026-12-15');  -- Gauteng Distribution, Bananas Small

-- =====================================================================
-- Extra Orders — December 2026 (12 orders)
-- =====================================================================
INSERT INTO orders (vendor_id, order_date, total_amount, status) VALUES
 (1,  '2026-12-01', 0, 'Completed'),   -- 31
 (3,  '2026-12-02', 0, 'Completed'),   -- 32
 (5,  '2026-12-03', 0, 'Completed'),   -- 33
 (7,  '2026-12-04', 0, 'Completed'),   -- 34
 (9,  '2026-12-05', 0, 'Completed'),   -- 35
 (11, '2026-12-06', 0, 'Completed'),   -- 36
 (2,  '2026-12-08', 0, 'Completed'),   -- 37
 (4,  '2026-12-09', 0, 'Completed'),   -- 38
 (6,  '2026-12-10', 0, 'Completed'),   -- 39
 (15, '2026-12-11', 0, 'Completed'),   -- 40  (new vendor)
 (16, '2026-12-12', 0, 'Processing'),  -- 41  (new vendor)
 (13, '2026-12-13', 0, 'Pending');     -- 42

-- =====================================================================
-- Extra Order Items for Dec orders (order IDs 31-42)
-- =====================================================================
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
 -- Order 31 (Palesa, Dec 01)
 (31, 1, 5, 45.00, 225.00), (31, 5, 4, 70.00, 280.00), (31, 10, 2, 55.00, 110.00),
 -- Order 32 (Mamello, Dec 02)
 (32, 7, 6, 42.00, 252.00), (32, 13, 3, 60.00, 180.00), (32, 25, 2, 72.00, 144.00),
 -- Order 33 (Lineo, Dec 03)
 (33, 4, 8, 38.00, 304.00), (33, 8, 3, 75.00, 225.00), (33, 19, 2, 50.00, 100.00),
 -- Order 34 (Nthabiseng, Dec 04)
 (34, 2, 4, 80.00, 320.00), (34, 11, 2, 95.00, 190.00), (34, 31, 2, 58.00, 116.00),
 -- Order 35 (Selloane, Dec 05)
 (35, 7, 5, 42.00, 210.00), (35, 14, 2, 105.00, 210.00), (35, 32, 1, 100.00, 100.00),
 -- Order 36 (Boitumelo, Dec 06)
 (36, 1, 6, 45.00, 270.00), (36, 4, 5, 38.00, 190.00), (36, 25, 2, 72.00, 144.00),
 -- Order 37 (Teboho, Dec 08)
 (37, 5, 4, 70.00, 280.00), (37, 10, 3, 55.00, 165.00), (37, 34, 2, 52.00, 104.00),
 -- Order 38 (Katleho, Dec 09)
 (38, 7, 6, 42.00, 252.00), (38, 16, 2, 65.00, 130.00), (38, 28, 3, 35.00, 105.00),
 -- Order 39 (Mpho, Dec 10)
 (39, 2, 3, 80.00, 240.00), (39, 11, 2, 95.00, 190.00), (39, 22, 4, 48.00, 192.00),
 -- Order 40 (Tlotliso, Dec 11 — new vendor)
 (40, 1, 4, 45.00, 180.00), (40, 7, 3, 42.00, 126.00), (40, 13, 2, 60.00, 120.00),
 -- Order 41 (Refiloe, Dec 12 — new vendor, Processing)
 (41, 4, 5, 38.00, 190.00), (41, 10, 2, 55.00, 110.00), (41, 25, 1, 72.00, 72.00),
 -- Order 42 (Nthati, Dec 13 — Pending)
 (42, 5, 4, 70.00, 280.00), (42, 8, 2, 75.00, 150.00), (42, 19, 3, 50.00, 150.00);

-- =====================================================================
-- Recalculate totals for the new orders
-- =====================================================================
UPDATE orders o SET total_amount = (
  SELECT COALESCE(SUM(subtotal),0) FROM order_items oi WHERE oi.order_id = o.id
) WHERE o.id BETWEEN 31 AND 42;

-- =====================================================================
-- Stock movements for new purchases and completed orders
-- =====================================================================

-- Stock IN for new purchases
INSERT INTO stock_movements (product_id, change_qty, movement_type, reference_id, note)
SELECT pu.product_id, pu.quantity, 'purchase', pu.id, 'Incoming stock purchase'
FROM purchases pu WHERE pu.purchase_date >= '2026-12-01';

-- Stock OUT for newly completed December orders (31-39, 40)
INSERT INTO stock_movements (product_id, change_qty, movement_type, reference_id, note)
SELECT oi.product_id, -oi.quantity, 'sale', oi.order_id, 'Sold on completed order'
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.status = 'Completed'
WHERE o.id BETWEEN 31 AND 42;
