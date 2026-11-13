# Batloung Fruits \u2014 Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        varchar full_name
        varchar email
        varchar password_hash
        enum role
    }
    SUPPLIERS {
        int id PK
        varchar name
        enum province
        varchar contact_person
        varchar telephone
        varchar email
        varchar address
    }
    FRUITS {
        int id PK
        varchar name
        varchar description
        tinyint is_active
    }
    BOX_SIZES {
        int id PK
        enum name
        varchar description
    }
    PRODUCTS {
        int id PK
        int fruit_id FK
        int box_size_id FK
        decimal selling_price
        tinyint is_active
    }
    STREET_VENDORS {
        int id PK
        varchar name
        varchar business_name
        varchar telephone
        varchar location
        date registration_date
        enum status
    }
    PURCHASES {
        int id PK
        int supplier_id FK
        int product_id FK
        int quantity
        decimal unit_cost
        date purchase_date
    }
    ORDERS {
        int id PK
        int vendor_id FK
        date order_date
        decimal total_amount
        enum status
    }
    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }
    STOCK_MOVEMENTS {
        int id PK
        int product_id FK
        int change_qty
        enum movement_type
        int reference_id
        varchar note
        int created_by FK
        timestamp created_at
    }

    FRUITS         ||--o{ PRODUCTS     : "has configurations"
    BOX_SIZES      ||--o{ PRODUCTS     : "defines"
    SUPPLIERS      ||--o{ PURCHASES    : "supplies"
    PRODUCTS       ||--o{ PURCHASES    : "restocked by"
    STREET_VENDORS ||--o{ ORDERS       : "places"
    ORDERS         ||--o{ ORDER_ITEMS  : "contains"
    PRODUCTS       ||--o{ ORDER_ITEMS  : "sold as"
    PRODUCTS       ||--o{ STOCK_MOVEMENTS : "stock changes"
    USERS          ||--o{ STOCK_MOVEMENTS : "records"
```

## Relationships

- **Supplier \u2192 Purchases (Stock)** : one supplier provides many stock purchases.
- **Fruit \u2192 Products** : one fruit has many Fruit+Box product configurations.
- **Box Size \u2192 Products** : one box size applies to many products.
- **Street Vendor \u2192 Orders** : one vendor places many orders.
- **Orders \u2192 Order Items** : one order contains many order items.
- **Products \u2192 Order Items** : one product appears in many order items.
- **Products \u2192 Stock Movements** : one product has many stock movements; its **available stock is the SUM of `change_qty`** across these rows (not a stored column).
- **Users \u2192 Stock Movements** : one user may record many stock movements (purchases, adjustments).

## Stock as a derived value (normalization note)

Stock level is **not** stored on `products`. It is computed from the
`stock_movements` ledger, where every change is an immutable signed row:

- `initial` / `purchase` / positive `adjustment` -> stock **IN** (`change_qty > 0`)
- `sale` (on order completion) / negative `adjustment` -> stock **OUT** (`change_qty < 0`)

This removes the update anomaly of a mutable running total and gives a full,
auditable history (what changed, why, by whom, and when).
