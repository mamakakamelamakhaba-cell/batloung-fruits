-- =====================================================================
--  Batloung Fruits — Full Seed Data (prices in Maloti, M)
--  Run: USE batloung_fruits; then paste this entire file.
--  Currency: Maloti (M / LSL) | Location: Maseru, Lesotho
-- =====================================================================
USE batloung_fruits;

-- =====================================================================
-- Users (Run `npm run seed` in backend for REAL working password hashes)
-- =====================================================================
INSERT INTO users (full_name, email, password_hash, role) VALUES
 ('System Administrator', 'admin@batloung.co.ls',
  '$2a$10$7Qd0zq3Xr9mKQJ1Yx9m0u6kqkqkqkqkqkqkqkqkqkqkqkqkqkqkq', 'Administrator'),
 ('Sales Clerk', 'sales@batloung.co.ls',
  '$2a$10$7Qd0zq3Xr9mKQJ1Yx9m0u6kqkqkqkqkqkqkqkqkqkqkqkqkqkqkq', 'Sales');
-- (Run `npm run seed` in the backend to write REAL working hashes.)

-- =====================================================================
-- Box sizes
-- =====================================================================
INSERT INTO box_sizes (name, description) VALUES
 ('Small',  'Small quantity box — ideal for street vendors with limited capital or lower daily demand.'),
 ('Medium', 'Medium quantity box — for vendors with moderate customer flow and steady demand.'),
 ('Large',  'Large quantity box — for high-volume vendors who purchase in bulk for better margins.');

-- =====================================================================
-- Fruits — 12 varieties for a rich, diverse product catalogue
-- =====================================================================
INSERT INTO fruits (name, description, is_active) VALUES
 ('Apples',       'Crisp, sweet apples sourced from Western Cape, Free State and Mpumalanga orchards.',          1),
 ('Bananas',      'Sweet, ripe bananas from Limpopo, KwaZulu-Natal and Mpumalanga lowveld farms.',               1),
 ('Oranges',      'Juicy vitamin-C-rich oranges from Limpopo, Mpumalanga and Eastern Cape citrus estates.',       1),
 ('Mangoes',      'Premium ripe mangoes from Limpopo, Mpumalanga and KwaZulu-Natal tropical farms.',             1),
 ('Grapes',       'Fresh seedless grapes from Western Cape, Northern Cape and Limpopo wine country.',            1),
 ('Avocados',     'Creamy nutrient-rich avocados from Limpopo and KwaZulu-Natal hillside farms.',                1),
 ('Pineapples',   'Sweet tropical pineapples sourced from KwaZulu-Natal and Mpumalanga coastal growers.',        1),
 ('Watermelons',  'Refreshing summer watermelons from Limpopo, Northern Cape and North West provinces.',          1),
 ('Strawberries', 'Plump, ruby-red strawberries from Western Cape and Mpumalanga highland berry farms.',         1),
 ('Lemons',       'Bright, tangy lemons from Limpopo, Eastern Cape and Western Cape citrus growers.',             1),
 ('Peaches',      'Golden, fragrant peaches from Western Cape, Free State and Mpumalanga orchards.',             1),
 ('Pears',        'Sweet, juicy pears sourced from Western Cape and Free State; harvested late summer.',          1);

-- =====================================================================
-- Suppliers — 12 companies across all 9 South African provinces
-- =====================================================================
INSERT INTO suppliers (name, province, contact_person, telephone, email, address) VALUES
 ('Cape Orchard Co.',       'Western Cape',  'Thabo Mokoena',    '+27 21 555 0101', 'sales@capeorchard.co.za',     '12 Vineyard Rd, Stellenbosch'),
 ('Freestate Farms',        'Free State',    'Lerato Dlamini',   '+27 51 555 0202', 'info@fsfarms.co.za',           '45 Maize Ave, Bloemfontein'),
 ('Limpopo Tropical',       'Limpopo',       'Sipho Nkosi',      '+27 15 555 0303', 'orders@limpopotrop.co.za',     '7 Baobab St, Polokwane'),
 ('KZN Banana Growers',     'KwaZulu-Natal', 'Nomsa Zulu',       '+27 31 555 0404', 'hello@kznbananas.co.za',       '88 Coastal Dr, Durban'),
 ('Mpumalanga Fresh',       'Mpumalanga',    'Jacob Pretorius',  '+27 13 555 0505', 'supply@mpfresh.co.za',         '3 Lowveld Rd, Nelspruit'),
 ('Northern Cape Vines',    'Northern Cape', 'Anele Botha',      '+27 54 555 0606', 'vines@ncvines.co.za',          '21 River Rd, Upington'),
 ('Eastern Cape Citrus',    'Eastern Cape',  'Zama Khumalo',     '+27 41 555 0707', 'citrus@eccitrus.co.za',        '9 Settlers Way, Gqeberha'),
 ('North West Harvest',     'North West',    'Refilwe Motaung',  '+27 18 555 0808', 'harvest@nwharvest.co.za',      '34 Marico St, Rustenburg'),
 ('Gauteng Distribution',   'Gauteng',       'Precious Sithole', '+27 11 555 0909', 'dist@gautengfresh.co.za',      '56 Joburg Market, Johannesburg'),
 ('Cape Berry Farms',       'Western Cape',  'Marina du Plessis','+27 21 555 1010', 'berries@capeberry.co.za',      '8 Berry Lane, Paarl'),
 ('Lowveld Citrus Estate',  'Mpumalanga',    'Andile Ngcobo',    '+27 13 555 1111', 'citrus@lowveldest.co.za',      '15 Citrus Way, White River'),
 ('Highveld Stone Fruits',  'Free State',    'Christa van Zyl',  '+27 51 555 1212', 'stone@highveldf.co.za',        '72 Peach Rd, Ficksburg');

-- =====================================================================
-- Products — all 12 fruits × 3 box sizes (36 products total)
-- Stock is NOT stored here; opening balances are in stock_movements below.
-- =====================================================================
-- Apples
INSERT INTO products (fruit_id, box_size_id, selling_price, is_active) VALUES
 ((SELECT id FROM fruits WHERE name='Apples'),       (SELECT id FROM box_sizes WHERE name='Small'),    45.00, 1),
 ((SELECT id FROM fruits WHERE name='Apples'),       (SELECT id FROM box_sizes WHERE name='Medium'),   80.00, 1),
 ((SELECT id FROM fruits WHERE name='Apples'),       (SELECT id FROM box_sizes WHERE name='Large'),   140.00, 1),
-- Bananas
 ((SELECT id FROM fruits WHERE name='Bananas'),      (SELECT id FROM box_sizes WHERE name='Small'),    38.00, 1),
 ((SELECT id FROM fruits WHERE name='Bananas'),      (SELECT id FROM box_sizes WHERE name='Medium'),   70.00, 1),
 ((SELECT id FROM fruits WHERE name='Bananas'),      (SELECT id FROM box_sizes WHERE name='Large'),   120.00, 1),
-- Oranges
 ((SELECT id FROM fruits WHERE name='Oranges'),      (SELECT id FROM box_sizes WHERE name='Small'),    42.00, 1),
 ((SELECT id FROM fruits WHERE name='Oranges'),      (SELECT id FROM box_sizes WHERE name='Medium'),   75.00, 1),
 ((SELECT id FROM fruits WHERE name='Oranges'),      (SELECT id FROM box_sizes WHERE name='Large'),   130.00, 1),
-- Mangoes
 ((SELECT id FROM fruits WHERE name='Mangoes'),      (SELECT id FROM box_sizes WHERE name='Small'),    55.00, 1),
 ((SELECT id FROM fruits WHERE name='Mangoes'),      (SELECT id FROM box_sizes WHERE name='Medium'),   95.00, 1),
 ((SELECT id FROM fruits WHERE name='Mangoes'),      (SELECT id FROM box_sizes WHERE name='Large'),   160.00, 1),
-- Grapes
 ((SELECT id FROM fruits WHERE name='Grapes'),       (SELECT id FROM box_sizes WHERE name='Small'),    60.00, 1),
 ((SELECT id FROM fruits WHERE name='Grapes'),       (SELECT id FROM box_sizes WHERE name='Medium'),  105.00, 1),
 ((SELECT id FROM fruits WHERE name='Grapes'),       (SELECT id FROM box_sizes WHERE name='Large'),   180.00, 1),
-- Avocados
 ((SELECT id FROM fruits WHERE name='Avocados'),     (SELECT id FROM box_sizes WHERE name='Small'),    65.00, 1),
 ((SELECT id FROM fruits WHERE name='Avocados'),     (SELECT id FROM box_sizes WHERE name='Medium'),  110.00, 1),
 ((SELECT id FROM fruits WHERE name='Avocados'),     (SELECT id FROM box_sizes WHERE name='Large'),   190.00, 1),
-- Pineapples
 ((SELECT id FROM fruits WHERE name='Pineapples'),   (SELECT id FROM box_sizes WHERE name='Small'),    50.00, 1),
 ((SELECT id FROM fruits WHERE name='Pineapples'),   (SELECT id FROM box_sizes WHERE name='Medium'),   88.00, 1),
 ((SELECT id FROM fruits WHERE name='Pineapples'),   (SELECT id FROM box_sizes WHERE name='Large'),   155.00, 1),
-- Watermelons
 ((SELECT id FROM fruits WHERE name='Watermelons'),  (SELECT id FROM box_sizes WHERE name='Small'),    48.00, 1),
 ((SELECT id FROM fruits WHERE name='Watermelons'),  (SELECT id FROM box_sizes WHERE name='Medium'),   85.00, 1),
 ((SELECT id FROM fruits WHERE name='Watermelons'),  (SELECT id FROM box_sizes WHERE name='Large'),   145.00, 1),
-- Strawberries
 ((SELECT id FROM fruits WHERE name='Strawberries'), (SELECT id FROM box_sizes WHERE name='Small'),    72.00, 1),
 ((SELECT id FROM fruits WHERE name='Strawberries'), (SELECT id FROM box_sizes WHERE name='Medium'),  128.00, 1),
 ((SELECT id FROM fruits WHERE name='Strawberries'), (SELECT id FROM box_sizes WHERE name='Large'),   220.00, 1),
-- Lemons
 ((SELECT id FROM fruits WHERE name='Lemons'),       (SELECT id FROM box_sizes WHERE name='Small'),    35.00, 1),
 ((SELECT id FROM fruits WHERE name='Lemons'),       (SELECT id FROM box_sizes WHERE name='Medium'),   62.00, 1),
 ((SELECT id FROM fruits WHERE name='Lemons'),       (SELECT id FROM box_sizes WHERE name='Large'),   108.00, 1),
-- Peaches
 ((SELECT id FROM fruits WHERE name='Peaches'),      (SELECT id FROM box_sizes WHERE name='Small'),    58.00, 1),
 ((SELECT id FROM fruits WHERE name='Peaches'),      (SELECT id FROM box_sizes WHERE name='Medium'),  100.00, 1),
 ((SELECT id FROM fruits WHERE name='Peaches'),      (SELECT id FROM box_sizes WHERE name='Large'),   175.00, 1),
-- Pears
 ((SELECT id FROM fruits WHERE name='Pears'),        (SELECT id FROM box_sizes WHERE name='Small'),    52.00, 1),
 ((SELECT id FROM fruits WHERE name='Pears'),        (SELECT id FROM box_sizes WHERE name='Medium'),   92.00, 1),
 ((SELECT id FROM fruits WHERE name='Pears'),        (SELECT id FROM box_sizes WHERE name='Large'),   162.00, 1);

-- =====================================================================
-- Street vendors — 14 vendors across Maseru areas
-- =====================================================================
INSERT INTO street_vendors (name, business_name, telephone, location, registration_date, status) VALUES
 ('Palesa Mohapi',      'Palesa Fresh Stall',        '+266 5800 1111', 'Maseru CBD',       '2026-01-15', 'Active'),
 ('Teboho Letsie',      'Teboho Fruit Corner',       '+266 5800 2222', 'Khubetsoana',      '2026-02-03', 'Active'),
 ('Mamello Ranthako',   'Mamello Market',             '+266 5800 3333', 'Thetsane',         '2026-02-20', 'Active'),
 ('Katleho Sello',      'Katleho Vendors',            '+266 5800 4444', 'Maseru West',      '2026-03-10', 'Active'),
 ('Lineo Mphutlane',    'Lineo Daily Fruits',         '+266 5800 5555', 'Ha Thetsane',      '2026-03-25', 'Active'),
 ('Mpho Sekhonyana',    'Mpho Fresh Corner',          '+266 5800 6666', 'Thamae',           '2026-04-08', 'Active'),
 ('Nthabiseng Mosia',   "Nthabiseng's Stall",         '+266 5800 7777', 'Hoohlo',           '2026-04-22', 'Active'),
 ('Rethabile Phoofolo', 'Rethabile Market',           '+266 5800 8888', 'Maseru CBD',       '2026-05-05', 'Active'),
 ('Selloane Nkosi',     'Selloane Fruit Express',     '+266 5800 9999', 'Lepereng',         '2026-05-18', 'Active'),
 ('Tsepiso Ramokoena',  'Tsepiso Village Stall',      '+266 5801 0001', 'Ha Thetsane',      '2026-06-01', 'Inactive'),
 ('Boitumelo Molefe',   'Boitumelo Sunrise Fruits',   '+266 5801 1111', 'Maseru East',      '2026-07-14', 'Active'),
 ('Limpho Makara',      'Limpho Premium Produce',     '+266 5801 2222', 'Qoaling',          '2026-07-28', 'Active'),
 ('Nthati Mofolo',      'Nthati Rainbow Stall',       '+266 5801 3333', 'Ha Abia',          '2026-08-10', 'Active'),
 ('Sello Ntsoaki',      'Sello Family Fruit Store',   '+266 5801 4444', 'Pitso Ground',     '2026-09-01', 'Active');

-- =====================================================================
-- Purchases (incoming stock from suppliers — Sep, Oct, Nov 2026)
-- =====================================================================
INSERT INTO purchases (supplier_id, product_id, quantity, unit_cost, purchase_date) VALUES
 -- === September 2026 ===
 (1,  1,  50, 28.00, '2026-09-01'),   -- Cape Orchard, Apples Small
 (3,  4,  60, 22.00, '2026-09-02'),   -- Limpopo Tropical, Bananas Small
 (7,  7,  45, 26.00, '2026-09-05'),   -- Eastern Cape Citrus, Oranges Small
 (3,  10, 35, 36.00, '2026-09-08'),   -- Limpopo Tropical, Mangoes Small
 (6,  13, 25, 40.00, '2026-09-10'),   -- Northern Cape Vines, Grapes Small
 (4,  5,  40, 45.00, '2026-09-12'),   -- KZN Bananas, Bananas Medium
 (5,  2,  30, 52.00, '2026-09-15'),   -- Mpumalanga Fresh, Apples Medium
 (3,  16, 20, 48.00, '2026-09-18'),   -- Limpopo Tropical, Avocados Small
 (5,  19, 25, 34.00, '2026-09-20'),   -- Mpumalanga Fresh, Pineapples Small
 (8,  22, 30, 32.00, '2026-09-22'),   -- North West Harvest, Watermelons Small
 (10, 25, 15, 52.00, '2026-09-25'),   -- Cape Berry Farms, Strawberries Small
 (11, 28, 20, 24.00, '2026-09-27'),   -- Lowveld Citrus Estate, Lemons Small
 -- === October 2026 ===
 (1,  3,  40, 90.00, '2026-10-01'),   -- Cape Orchard, Apples Large
 (2,  6,  35, 76.00, '2026-10-03'),   -- Freestate Farms, Bananas Large
 (3,  12, 20, 105.00,'2026-10-05'),   -- Limpopo Tropical, Mangoes Large
 (6,  14, 15, 70.00, '2026-10-07'),   -- Northern Cape Vines, Grapes Medium
 (4,  8,  50, 49.00, '2026-10-08'),   -- KZN Bananas, Oranges Medium
 (7,  9,  25, 85.00, '2026-10-10'),   -- Eastern Cape Citrus, Oranges Large
 (9,  11, 30, 62.00, '2026-10-12'),   -- Gauteng Dist., Mangoes Medium
 (5,  20, 20, 57.00, '2026-10-14'),   -- Mpumalanga Fresh, Pineapples Medium
 (12, 31, 18, 68.00, '2026-10-16'),   -- Highveld Stone Fruits, Peaches Small
 (12, 34, 15, 60.00, '2026-10-18'),   -- Highveld Stone Fruits, Pears Small
 (10, 26, 12, 90.00, '2026-10-20'),   -- Cape Berry Farms, Strawberries Medium
 (1,  32, 20, 110.00,'2026-10-22'),   -- Cape Orchard, Peaches Medium
 -- === November 2026 ===
 (3,  4,  70, 21.00, '2026-11-01'),   -- Limpopo Tropical, Bananas Small
 (1,  1,  60, 27.00, '2026-11-02'),   -- Cape Orchard, Apples Small
 (7,  7,  55, 25.00, '2026-11-03'),   -- Eastern Cape Citrus, Oranges Small
 (11, 29, 25, 42.00, '2026-11-04'),   -- Lowveld Citrus Estate, Lemons Medium
 (12, 33, 22, 95.00, '2026-11-05'),   -- Highveld Stone Fruits, Peaches Large
 (5,  21, 18, 97.00, '2026-11-06'),   -- Mpumalanga Fresh, Pineapples Large
 (10, 27, 10, 155.00,'2026-11-07'),   -- Cape Berry Farms, Strawberries Large
 (6,  15, 20, 120.00,'2026-11-08'),   -- Northern Cape Vines, Grapes Large
 (3,  11, 25, 60.00, '2026-11-09'),   -- Limpopo Tropical, Mangoes Medium
 (4,  17, 15, 72.00, '2026-11-10'),   -- KZN Bananas, Avocados Medium
 (1,  35, 20, 61.00, '2026-11-11'),   -- Cape Orchard, Pears Medium
 (8,  23, 25, 55.00, '2026-11-12');   -- North West Harvest, Watermelons Medium

-- =====================================================================
-- Orders — rich dataset: 30 orders across Sep–Nov 2026
-- =====================================================================
INSERT INTO orders (vendor_id, order_date, total_amount, status) VALUES
 -- September completed orders (10)
 (1,  '2026-09-10', 0, 'Completed'),
 (2,  '2026-09-12', 0, 'Completed'),
 (3,  '2026-09-14', 0, 'Completed'),
 (4,  '2026-09-16', 0, 'Completed'),
 (5,  '2026-09-18', 0, 'Completed'),
 (1,  '2026-09-20', 0, 'Completed'),
 (6,  '2026-09-22', 0, 'Completed'),
 (7,  '2026-09-24', 0, 'Completed'),
 (2,  '2026-09-26', 0, 'Completed'),
 (8,  '2026-09-28', 0, 'Completed'),
 -- October completed + in-progress (10)
 (1,  '2026-10-02', 0, 'Completed'),
 (3,  '2026-10-04', 0, 'Completed'),
 (5,  '2026-10-05', 0, 'Completed'),
 (2,  '2026-10-06', 0, 'Completed'),
 (4,  '2026-10-07', 0, 'Completed'),
 (6,  '2026-10-08', 0, 'Pending'),
 (7,  '2026-10-09', 0, 'Pending'),
 (9,  '2026-10-10', 0, 'Processing'),
 (1,  '2026-10-11', 0, 'Processing'),
 (8,  '2026-10-12', 0, 'Pending'),
 -- November fresh orders (10)
 (11, '2026-11-01', 0, 'Completed'),
 (12, '2026-11-02', 0, 'Completed'),
 (13, '2026-11-03', 0, 'Completed'),
 (14, '2026-11-04', 0, 'Completed'),
 (1,  '2026-11-05', 0, 'Completed'),
 (2,  '2026-11-06', 0, 'Processing'),
 (3,  '2026-11-07', 0, 'Confirmed'),
 (5,  '2026-11-08', 0, 'Pending'),
 (11, '2026-11-09', 0, 'Pending'),
 (12, '2026-11-10', 0, 'Ready for Collection/Delivery');

-- =====================================================================
-- Order items — comprehensive spread across all 12 fruits and 3 box sizes
-- =====================================================================
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
 -- Order 1 (Palesa, Sep 10)
 (1, 1, 4, 45.00, 180.00), (1, 5, 3, 70.00, 210.00), (1, 7, 2, 42.00, 84.00),
 -- Order 2 (Teboho, Sep 12)
 (2, 4, 5, 38.00, 190.00), (2, 10, 2, 55.00, 110.00), (2, 13, 2, 60.00, 120.00),
 -- Order 3 (Mamello, Sep 14)
 (3, 7, 6, 42.00, 252.00), (3, 8, 3, 75.00, 225.00), (3, 16, 2, 65.00, 130.00),
 -- Order 4 (Katleho, Sep 16)
 (4, 2, 3, 80.00, 240.00), (4, 11, 2, 95.00, 190.00), (4, 19, 2, 50.00, 100.00),
 -- Order 5 (Lineo, Sep 18)
 (5, 5, 4, 70.00, 280.00), (5, 14, 2, 105.00, 210.00), (5, 22, 3, 48.00, 144.00),
 -- Order 6 (Palesa, Sep 20)
 (6, 1, 5, 45.00, 225.00), (6, 4, 4, 38.00, 152.00), (6, 10, 2, 55.00, 110.00),
 -- Order 7 (Mpho, Sep 22)
 (7, 7, 3, 42.00, 126.00), (7, 13, 3, 60.00, 180.00), (7, 16, 2, 65.00, 130.00),
 -- Order 8 (Nthabiseng, Sep 24)
 (8, 8, 4, 75.00, 300.00), (8, 11, 2, 95.00, 190.00), (8, 20, 2, 88.00, 176.00),
 -- Order 9 (Teboho, Sep 26)
 (9, 4, 6, 38.00, 228.00), (9, 5, 4, 70.00, 280.00), (9, 22, 3, 48.00, 144.00),
 -- Order 10 (Rethabile, Sep 28)
 (10, 1, 5, 45.00, 225.00), (10, 7, 4, 42.00, 168.00), (10, 19, 2, 50.00, 100.00),
 -- Order 11 (Palesa, Oct 02)
 (11, 2, 3, 80.00, 240.00), (11, 5, 5, 70.00, 350.00), (11, 13, 2, 60.00, 120.00),
 -- Order 12 (Mamello, Oct 04)
 (12, 7, 5, 42.00, 210.00), (12, 8, 3, 75.00, 225.00), (12, 16, 2, 65.00, 130.00),
 -- Order 13 (Lineo, Oct 05)
 (13, 4, 6, 38.00, 228.00), (13, 10, 3, 55.00, 165.00), (13, 22, 2, 48.00, 96.00),
 -- Order 14 (Teboho, Oct 06)
 (14, 11, 2, 95.00, 190.00), (14, 14, 2, 105.00, 210.00), (14, 20, 2, 88.00, 176.00),
 -- Order 15 (Katleho, Oct 07)
 (15, 1, 4, 45.00, 180.00), (15, 7, 3, 42.00, 126.00), (15, 19, 2, 50.00, 100.00),
 -- Order 16 (Mpho, Oct 08 — Pending)
 (16, 4, 5, 38.00, 190.00), (16, 13, 2, 60.00, 120.00), (16, 25, 2, 72.00, 144.00),
 -- Order 17 (Nthabiseng, Oct 09 — Pending)
 (17, 10, 3, 55.00, 165.00), (17, 16, 2, 65.00, 130.00), (17, 31, 2, 58.00, 116.00),
 -- Order 18 (Selloane, Oct 10 — Processing)
 (18, 8, 4, 75.00, 300.00), (18, 22, 3, 48.00, 144.00), (18, 34, 2, 52.00, 104.00),
 -- Order 19 (Palesa, Oct 11 — Processing)
 (19, 2, 3, 80.00, 240.00), (19, 5, 3, 70.00, 210.00), (19, 28, 3, 35.00, 105.00),
 -- Order 20 (Rethabile, Oct 12 — Pending)
 (20, 1, 5, 45.00, 225.00), (20, 4, 4, 38.00, 152.00), (20, 26, 2, 128.00, 256.00),
 -- Order 21 (Boitumelo, Nov 01 — Completed)
 (21, 1, 4, 45.00, 180.00), (21, 25, 2, 72.00, 144.00), (21, 31, 3, 58.00, 174.00),
 -- Order 22 (Limpho, Nov 02 — Completed)
 (22, 4, 5, 38.00, 190.00), (22, 7, 4, 42.00, 168.00), (22, 34, 2, 52.00, 104.00),
 -- Order 23 (Nthati, Nov 03 — Completed)
 (23, 10, 3, 55.00, 165.00), (23, 13, 2, 60.00, 120.00), (23, 28, 3, 35.00, 105.00),
 -- Order 24 (Sello, Nov 04 — Completed)
 (24, 2, 3, 80.00, 240.00), (24, 19, 2, 50.00, 100.00), (24, 35, 2, 92.00, 184.00),
 -- Order 25 (Palesa, Nov 05 — Completed)
 (25, 5, 4, 70.00, 280.00), (25, 16, 2, 65.00, 130.00), (25, 32, 1, 100.00, 100.00),
 -- Order 26 (Teboho, Nov 06 — Processing)
 (26, 11, 3, 95.00, 285.00), (26, 22, 2, 48.00, 96.00), (26, 26, 1, 128.00, 128.00),
 -- Order 27 (Mamello, Nov 07 — Confirmed)
 (27, 7, 4, 42.00, 168.00), (27, 29, 2, 62.00, 124.00), (27, 34, 2, 52.00, 104.00),
 -- Order 28 (Lineo, Nov 08 — Pending)
 (28, 4, 6, 38.00, 228.00), (28, 25, 2, 72.00, 144.00), (28, 31, 2, 58.00, 116.00),
 -- Order 29 (Boitumelo, Nov 09 — Pending)
 (29, 1, 4, 45.00, 180.00), (29, 8, 2, 75.00, 150.00), (29, 28, 3, 35.00, 105.00),
 -- Order 30 (Limpho, Nov 10 — Ready for Collection/Delivery)
 (30, 5, 5, 70.00, 350.00), (30, 13, 2, 60.00, 120.00), (30, 32, 2, 100.00, 200.00);

-- =====================================================================
-- Recalculate order totals from items
-- =====================================================================
UPDATE orders o SET total_amount = (
  SELECT COALESCE(SUM(subtotal),0) FROM order_items oi WHERE oi.order_id = o.id
);

-- =====================================================================
-- Stock movements ledger  (single source of truth for stock levels)
--   Available stock per product = SUM(change_qty) over its rows.
-- =====================================================================

-- 1) Opening balances as 'initial' IN movements (product ids 1..36)
INSERT INTO stock_movements (product_id, change_qty, movement_type, note) VALUES
 -- Apples (1,2,3)
 (1, 120,'initial','Opening balance'), (2,  90,'initial','Opening balance'), (3,  60,'initial','Opening balance'),
 -- Bananas (4,5,6)
 (4, 150,'initial','Opening balance'), (5, 110,'initial','Opening balance'), (6,  55,'initial','Opening balance'),
 -- Oranges (7,8,9)
 (7, 110,'initial','Opening balance'), (8,  85,'initial','Opening balance'), (9,  50,'initial','Opening balance'),
 -- Mangoes (10,11,12)
 (10, 80,'initial','Opening balance'), (11, 60,'initial','Opening balance'), (12, 35,'initial','Opening balance'),
 -- Grapes (13,14,15)
 (13, 70,'initial','Opening balance'), (14, 45,'initial','Opening balance'), (15, 25,'initial','Opening balance'),
 -- Avocados (16,17,18)
 (16, 60,'initial','Opening balance'), (17, 40,'initial','Opening balance'), (18, 18,'initial','Opening balance'),
 -- Pineapples (19,20,21)
 (19, 75,'initial','Opening balance'), (20, 50,'initial','Opening balance'), (21, 30,'initial','Opening balance'),
 -- Watermelons (22,23,24)
 (22, 90,'initial','Opening balance'), (23, 65,'initial','Opening balance'), (24, 40,'initial','Opening balance'),
 -- Strawberries (25,26,27)
 (25, 50,'initial','Opening balance'), (26, 30,'initial','Opening balance'), (27, 15,'initial','Opening balance'),
 -- Lemons (28,29,30)
 (28, 80,'initial','Opening balance'), (29, 55,'initial','Opening balance'), (30, 30,'initial','Opening balance'),
 -- Peaches (31,32,33)
 (31, 60,'initial','Opening balance'), (32, 45,'initial','Opening balance'), (33, 20,'initial','Opening balance'),
 -- Pears (34,35,36)
 (34, 70,'initial','Opening balance'), (35, 50,'initial','Opening balance'), (36, 28,'initial','Opening balance');

-- 2) Incoming stock from every purchase (positive change_qty)
INSERT INTO stock_movements (product_id, change_qty, movement_type, reference_id, note)
SELECT pu.product_id, pu.quantity, 'purchase', pu.id, 'Incoming stock purchase'
FROM purchases pu;

-- 3) Stock OUT for COMPLETED orders only (negative change_qty)
INSERT INTO stock_movements (product_id, change_qty, movement_type, reference_id, note)
SELECT oi.product_id, -oi.quantity, 'sale', oi.order_id, 'Sold on completed order'
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.status = 'Completed';
