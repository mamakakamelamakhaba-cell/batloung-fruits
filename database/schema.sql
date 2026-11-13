-- =====================================================================
--  Batloung Fruits Distribution Management System
--  DIWA2110 - Web Application Development  (MySQL schema)
--  Currency: Maloti (M / LSL)  |  Location: Maseru, Lesotho
-- =====================================================================

DROP DATABASE IF EXISTS batloung_fruits;
CREATE DATABASE batloung_fruits CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE batloung_fruits;

-- ---------------------------------------------------------------------
--  Users (RBAC: Administrator / Sales)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('Administrator','Sales') NOT NULL DEFAULT 'Sales',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Suppliers (sourced from the 9 South African provinces)
-- ---------------------------------------------------------------------
CREATE TABLE suppliers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  province       ENUM('Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
                      'Limpopo','Mpumalanga','Northern Cape','North West',
                      'Western Cape') NOT NULL,
  contact_person VARCHAR(120),
  telephone      VARCHAR(40),
  email          VARCHAR(160),
  address        VARCHAR(255),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Fruits (only the five specified fruits initially)
-- ---------------------------------------------------------------------
CREATE TABLE fruits (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255),
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Box sizes (Small / Medium / Large)
-- ---------------------------------------------------------------------
CREATE TABLE box_sizes (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  ENUM('Small','Medium','Large') NOT NULL UNIQUE,
  description VARCHAR(255)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Products = Fruit + Box Size  (distinct saleable configuration)
--  Each product has its own selling price (Maloti).
--  NOTE (normalization): stock quantity is NO LONGER stored as a mutable
--  column here. It is derived from the stock_movements ledger below, so
--  the available quantity can never drift out of sync with its history.
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  fruit_id       INT NOT NULL,
  box_size_id    INT NOT NULL,
  selling_price  DECIMAL(10,2) NOT NULL CHECK (selling_price > 0),
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_fruit_box (fruit_id, box_size_id),
  CONSTRAINT fk_prod_fruit FOREIGN KEY (fruit_id)    REFERENCES fruits(id)    ON DELETE CASCADE,
  CONSTRAINT fk_prod_box   FOREIGN KEY (box_size_id) REFERENCES box_sizes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Street vendors (located in areas of Maseru)
-- ---------------------------------------------------------------------
CREATE TABLE street_vendors (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  business_name VARCHAR(150),
  telephone     VARCHAR(40),
  location      VARCHAR(120),             -- area in Maseru
  registration_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  status        ENUM('Active','Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Purchases = incoming stock from a supplier for a product
-- ---------------------------------------------------------------------
CREATE TABLE purchases (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id   INT NOT NULL,
  product_id    INT NOT NULL,
  quantity      INT NOT NULL CHECK (quantity > 0),
  unit_cost     DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
  purchase_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT fk_pur_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  CONSTRAINT fk_pur_product  FOREIGN KEY (product_id)  REFERENCES products(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Orders placed by street vendors
-- ---------------------------------------------------------------------
CREATE TABLE orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id   INT NOT NULL,
  order_date  DATE NOT NULL DEFAULT (CURRENT_DATE),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status      ENUM('Pending','Confirmed','Processing','Ready for Collection/Delivery',
                   'Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_vendor FOREIGN KEY (vendor_id) REFERENCES street_vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Order items (an order must contain at least one item)
-- ---------------------------------------------------------------------
CREATE TABLE order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  subtotal   DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_item_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Stock movements (ledger)  -- single source of truth for stock levels
--  Every event that changes stock is one immutable, signed row:
--    change_qty > 0  = stock IN   (initial opening balance, purchase,
--                                  positive adjustment)
--    change_qty < 0  = stock OUT  (sale on order completion,
--                                  negative adjustment)
--  Available stock for a product = SUM(change_qty) over its movements.
-- ---------------------------------------------------------------------
CREATE TABLE stock_movements (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  product_id    INT NOT NULL,
  change_qty    INT NOT NULL,                 -- signed: + = IN, - = OUT
  movement_type ENUM('initial','purchase','sale','adjustment') NOT NULL,
  reference_id  INT NULL,                     -- source row (purchase id / order id)
  note          VARCHAR(255),                 -- human reason, e.g. 'damaged crate'
  created_by    INT NULL,                     -- which user triggered it
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sm_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_sm_user    FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Helpful indexes
-- ---------------------------------------------------------------------
CREATE INDEX idx_sm_product ON stock_movements(product_id);
CREATE INDEX idx_sm_type    ON stock_movements(movement_type);
CREATE INDEX idx_suppliers_province ON suppliers(province);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_date        ON orders(order_date);
CREATE INDEX idx_vendors_location   ON street_vendors(location);
