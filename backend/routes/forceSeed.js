const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/:key', async (req, res) => {
  if (req.params.key !== process.env.SETUP_KEY) return res.status(403).send('Unauthorized');

  try {
    // We use "multipleStatements: true" via a direct connection to run everything at once
    const mysql = require('mysql2/promise');
    let dbUrl = process.env.DATABASE_URL || '';
    dbUrl = dbUrl.split('?')[0];

    const conn = await mysql.createConnection({
      uri: dbUrl,
      ssl: { rejectUnauthorized: false },
      multipleStatements: true
    });

    // The exact SQL to fix the data (no DROP/CREATE, no USE)
    const sql = `
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM purchases;
      DELETE FROM street_vendors;
      DELETE FROM suppliers;
      
      INSERT INTO suppliers (name, province, contact_person, telephone, email, address) VALUES
      ('Cape Orchard Co.', 'Western Cape', 'Thabo Mokoena', '+27 21 555 0101', 'sales@capeorchard.co.za', '12 Vineyard Rd, Stellenbosch'),
      ('Freestate Farms', 'Free State', 'Lerato Dlamini', '+27 51 555 0202', 'info@fsfarms.co.za', '45 Maize Ave, Bloemfontein'),
      ('Limpopo Tropical', 'Limpopo', 'Sipho Nkosi', '+27 15 555 0303', 'orders@limpopotrop.co.za', '7 Baobab St, Polokwane'),
      ('KZN Banana Growers', 'KwaZulu-Natal', 'Nomsa Zulu', '+27 31 555 0404', 'hello@kznbananas.co.za', '88 Coastal Dr, Durban'),
      ('Mpumalanga Fresh', 'Mpumalanga', 'Jacob Pretorius', '+27 13 555 0505', 'supply@mpfresh.co.za', '3 Lowveld Rd, Nelspruit'),
      ('Northern Cape Vines', 'Northern Cape', 'Anele Botha', '+27 54 555 0606', 'vines@ncvines.co.za', '21 River Rd, Upington'),
      ('Eastern Cape Citrus', 'Eastern Cape', 'Zama Khumalo', '+27 41 555 0707', 'citrus@eccitrus.co.za', '9 Settlers Way, Gqeberha'),
      ('North West Harvest', 'North West', 'Refilwe Motaung', '+27 18 555 0808', 'harvest@nwharvest.co.za', '34 Marico St, Rustenburg'),
      ('Gauteng Distribution', 'Gauteng', 'Precious Sithole', '+27 11 555 0909', 'dist@gautengfresh.co.za', '56 Joburg Market, Johannesburg'),
      ('Cape Berry Farms', 'Western Cape', 'Marina du Plessis', '+27 21 555 1010', 'berries@capeberry.co.za', '8 Berry Lane, Paarl'),
      ('Lowveld Citrus Estate', 'Mpumalanga', 'Andile Ngcobo', '+27 13 555 1111', 'citrus@lowveldest.co.za', '15 Citrus Way, White River'),
      ('Highveld Stone Fruits', 'Free State', 'Christa van Zyl', '+27 51 555 1212', 'stone@highveldf.co.za', '72 Peach Rd, Ficksburg');

      INSERT INTO street_vendors (name, business_name, telephone, location, registration_date, status) VALUES
      ('Palesa Mohapi', 'Palesa Fresh Stall', '+266 5800 1111', 'Maseru CBD', '2026-01-15', 'Active'),
      ('Teboho Letsie', 'Teboho Fruit Corner', '+266 5800 2222', 'Khubetsoana', '2026-02-03', 'Active'),
      ('Mamello Ranthako', 'Mamello Market', '+266 5800 3333', 'Thetsane', '2026-02-20', 'Active'),
      ('Katleho Sello', 'Katleho Vendors', '+266 5800 4444', 'Maseru West', '2026-03-10', 'Active'),
      ('Lineo Mphutlane', 'Lineo Daily Fruits', '+266 5800 5555', 'Ha Thetsane', '2026-03-25', 'Active'),
      ('Mpho Sekhonyana', 'Mpho Fresh Corner', '+266 5800 6666', 'Thamae', '2026-04-08', 'Active'),
      ('Nthabiseng Mosia', 'Nthabiseng Stall', '+266 5800 7777', 'Hoohlo', '2026-04-22', 'Active'),
      ('Rethabile Phoofolo', 'Rethabile Market', '+266 5800 8888', 'Maseru CBD', '2026-05-05', 'Active'),
      ('Selloane Nkosi', 'Selloane Fruit Express', '+266 5800 9999', 'Lepereng', '2026-05-18', 'Active'),
      ('Tsepiso Ramokoena', 'Tsepiso Village Stall', '+266 5801 0001', 'Ha Thetsane', '2026-06-01', 'Inactive'),
      ('Boitumelo Molefe', 'Boitumelo Sunrise Fruits', '+266 5801 1111', 'Maseru East', '2026-07-14', 'Active'),
      ('Limpho Makara', 'Limpho Premium Produce', '+266 5801 2222', 'Qoaling', '2026-07-28', 'Active'),
      ('Nthati Mofolo', 'Nthati Rainbow Stall', '+266 5801 3333', 'Ha Abia', '2026-08-10', 'Active'),
      ('Sello Ntsoaki', 'Sello Family Fruit Store', '+266 5801 4444', 'Pitso Ground', '2026-09-01', 'Active');

      INSERT INTO orders (vendor_id, order_date, total_amount, status) VALUES 
      (1, '2026-09-10', 474.00, 'Completed'), (2, '2026-09-12', 420.00, 'Completed'), (3, '2026-09-14', 607.00, 'Completed'), (4, '2026-09-16', 530.00, 'Completed'), (5, '2026-09-18', 634.00, 'Completed'), (1, '2026-09-20', 487.00, 'Completed'), (6, '2026-09-22', 436.00, 'Completed'), (7, '2026-09-24', 666.00, 'Completed'), (2, '2026-09-26', 652.00, 'Completed'), (8, '2026-09-28', 493.00, 'Completed'),
      (1, '2026-10-02', 710.00, 'Completed'), (3, '2026-10-04', 565.00, 'Completed'), (5, '2026-10-05', 489.00, 'Completed'), (2, '2026-10-06', 576.00, 'Completed'), (4, '2026-10-07', 406.00, 'Completed'), (6, '2026-10-08', 454.00, 'Pending'), (7, '2026-10-09', 411.00, 'Pending'), (9, '2026-10-10', 548.00, 'Processing'), (1, '2026-10-11', 555.00, 'Processing'), (8, '2026-10-12', 633.00, 'Pending'),
      (11, '2026-11-01', 498.00, 'Completed'), (12, '2026-11-02', 462.00, 'Completed'), (13, '2026-11-03', 390.00, 'Completed'), (14, '2026-11-04', 524.00, 'Completed'), (1, '2026-11-05', 510.00, 'Completed'), (2, '2026-11-06', 509.00, 'Processing'), (3, '2026-11-07', 396.00, 'Confirmed'), (5, '2026-11-08', 488.00, 'Pending'), (11, '2026-11-09', 435.00, 'Pending'), (12, '2026-11-10', 670.00, 'Ready for Collection/Delivery');

      INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
      (1, 1, 4, 45.00, 180.00), (1, 5, 3, 70.00, 210.00), (1, 7, 2, 42.00, 84.00), (2, 4, 5, 38.00, 190.00), (2, 10, 2, 55.00, 110.00), (2, 13, 2, 60.00, 120.00),
      (3, 7, 6, 42.00, 252.00), (3, 8, 3, 75.00, 225.00), (3, 16, 2, 65.00, 130.00), (4, 2, 3, 80.00, 240.00), (4, 11, 2, 95.00, 190.00), (4, 19, 2, 50.00, 100.00),
      (5, 5, 4, 70.00, 280.00), (5, 14, 2, 105.00, 210.00), (5, 22, 3, 48.00, 144.00), (6, 1, 5, 45.00, 225.00), (6, 4, 4, 38.00, 152.00), (6, 10, 2, 55.00, 110.00),
      (7, 7, 3, 42.00, 126.00), (7, 13, 3, 60.00, 180.00), (7, 16, 2, 65.00, 130.00), (8, 8, 4, 75.00, 300.00), (8, 11, 2, 95.00, 190.00), (8, 20, 2, 88.00, 176.00),
      (9, 4, 6, 38.00, 228.00), (9, 5, 4, 70.00, 280.00), (9, 22, 3, 48.00, 144.00), (10, 1, 5, 45.00, 225.00), (10, 7, 4, 42.00, 168.00), (10, 19, 2, 50.00, 100.00),
      (11, 2, 3, 80.00, 240.00), (11, 5, 5, 70.00, 350.00), (11, 13, 2, 60.00, 120.00), (12, 7, 5, 42.00, 210.00), (12, 8, 3, 75.00, 225.00), (12, 16, 2, 65.00, 130.00),
      (13, 4, 6, 38.00, 228.00), (13, 10, 3, 55.00, 165.00), (13, 22, 2, 48.00, 96.00), (14, 11, 2, 95.00, 190.00), (14, 14, 2, 105.00, 210.00), (14, 20, 2, 88.00, 176.00),
      (15, 1, 4, 45.00, 180.00), (15, 7, 3, 42.00, 126.00), (15, 19, 2, 50.00, 100.00), (16, 4, 5, 38.00, 190.00), (16, 13, 2, 60.00, 120.00), (16, 25, 2, 72.00, 144.00),
      (17, 10, 3, 55.00, 165.00), (17, 16, 2, 65.00, 130.00), (17, 31, 2, 58.00, 116.00), (18, 8, 4, 75.00, 300.00), (18, 22, 3, 48.00, 144.00), (18, 34, 2, 52.00, 104.00),
      (19, 2, 3, 80.00, 240.00), (19, 5, 3, 70.00, 210.00), (19, 28, 3, 35.00, 105.00), (20, 1, 5, 45.00, 225.00), (20, 4, 4, 38.00, 152.00), (20, 26, 2, 128.00, 256.00),
      (21, 1, 4, 45.00, 180.00), (21, 25, 2, 72.00, 144.00), (21, 31, 3, 58.00, 174.00), (22, 4, 5, 38.00, 190.00), (22, 7, 4, 42.00, 168.00), (22, 34, 2, 52.00, 104.00),
      (23, 10, 3, 55.00, 165.00), (23, 13, 2, 60.00, 120.00), (23, 28, 3, 35.00, 105.00), (24, 2, 3, 80.00, 240.00), (24, 19, 2, 50.00, 100.00), (24, 35, 2, 92.00, 184.00),
      (25, 5, 4, 70.00, 280.00), (25, 16, 2, 65.00, 130.00), (25, 32, 1, 100.00, 100.00), (26, 11, 3, 95.00, 285.00), (26, 22, 2, 48.00, 96.00), (26, 26, 1, 128.00, 128.00),
      (27, 7, 4, 42.00, 168.00), (27, 29, 2, 62.00, 124.00), (27, 34, 2, 52.00, 104.00), (28, 4, 6, 38.00, 228.00), (28, 25, 2, 72.00, 144.00), (28, 31, 2, 58.00, 116.00),
      (29, 1, 4, 45.00, 180.00), (29, 8, 2, 75.00, 150.00), (29, 28, 3, 35.00, 105.00), (30, 5, 5, 70.00, 350.00), (30, 13, 2, 60.00, 120.00), (30, 32, 2, 100.00, 200.00);
    `;

    await conn.query(sql);
    await conn.end();

    res.send('Success! All tables populated perfectly.');
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

module.exports = router;
