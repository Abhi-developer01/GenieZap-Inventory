# Google Sheet setup (manual or automated)

## Credentials this app uses

From your service account JSON, you only need **three** values in `.env.local`:

| Variable | JSON field | Example |
|----------|------------|---------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` | `google-sheet@....iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | `private_key` | Full key in quotes, keep `\n` |
| `GOOGLE_SHEET_ID` | *(not in JSON)* | ID from the sheet URL |

**Do not** use `private_key_id` as `GOOGLE_SHEET_ID` — that is only a key identifier.

You do **not** need: `project_id`, `client_id`, `auth_uri`, etc. in `.env.local`.

---

## Enable APIs (required once)

In [Google Cloud Console](https://console.cloud.google.com/) → project **smart-ruler-496713-k2**:

1. **APIs & Services** → **Library**
2. Enable **Google Sheets API**
3. Enable **Google Drive API** (for auto-sharing the sheet with your Gmail)

---

## Option A — Automatic (recommended)

Add your Gmail so you can open the sheet in Drive:

```env
GOOGLE_SHARE_EMAIL=your@gmail.com
```

Then run:

```bash
npm run setup:sheet
```

This creates **GenieZap Inventory** with four tabs and header rows, updates `GOOGLE_SHEET_ID`, and shares the file with you.

---

## Option B — Manual spreadsheet

1. Create a new Google Sheet.
2. Rename the first tab to **Products** and add row 1:

   `id` | `name` | `sku` | `category` | `quantity` | `price` | `barcode` | `image` | `low_stock_threshold` | `created_at` | `updated_at`

3. Add tabs **InventoryHistory**, **Purchases**, **Sales** with these row-1 headers:

   **InventoryHistory:**  
   `id` | `product_id` | `product_name` | `type` | `quantity` | `previous_qty` | `new_qty` | `notes` | `created_at`

   **Purchases:**  
   `id` | `product_id` | `product_name` | `supplier` | `quantity` | `unit_cost` | `total_cost` | `date` | `notes` | `created_at`

   **Sales:**  
   `id` | `product_id` | `product_name` | `customer` | `quantity` | `unit_price` | `total_price` | `date` | `notes` | `created_at`

4. **Share** the sheet with  
   `google-sheet@smart-ruler-496713-k2.iam.gserviceaccount.com`  
   as **Editor**.

5. Copy the spreadsheet ID from the URL into `.env.local`:

   `https://docs.google.com/spreadsheets/d/THIS_PART/edit`

6. Restart the dev server: `npm run dev`
