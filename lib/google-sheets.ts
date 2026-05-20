import { google, sheets_v4 } from "googleapis";
import type {
  InventoryHistoryEntry,
  Product,
  Purchase,
  Sale,
} from "@/lib/types";
import { generateId } from "@/lib/utils";

export const SHEET_TABS = {
  products: "Products",
  history: "InventoryHistory",
  purchases: "Purchases",
  sales: "Sales",
} as const;

const PRODUCT_HEADERS = [
  "id",
  "name",
  "sku",
  "category",
  "quantity",
  "price",
  "barcode",
  "image",
  "low_stock_threshold",
  "created_at",
  "updated_at",
];

const HISTORY_HEADERS = [
  "id",
  "product_id",
  "product_name",
  "type",
  "quantity",
  "previous_qty",
  "new_qty",
  "notes",
  "created_at",
];

const PURCHASE_HEADERS = [
  "id",
  "product_id",
  "product_name",
  "supplier",
  "quantity",
  "unit_cost",
  "total_cost",
  "date",
  "notes",
  "created_at",
];

const SALE_HEADERS = [
  "id",
  "product_id",
  "product_name",
  "customer",
  "mobile",
  "quantity",
  "unit_price",
  "total_price",
  "date",
  "notes",
  "created_at",
];

function getSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) {
    throw new Error(
      "GOOGLE_SHEET_ID is not configured. See README for setup instructions.",
    );
  }
  return id;
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error(
      "Google service account credentials are missing. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.",
    );
  }
  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getClient(): Promise<sheets_v4.Sheets> {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

const TAB_DEFINITIONS = [
  { name: SHEET_TABS.products, headers: PRODUCT_HEADERS },
  { name: SHEET_TABS.history, headers: HISTORY_HEADERS },
  { name: SHEET_TABS.purchases, headers: PURCHASE_HEADERS },
  { name: SHEET_TABS.sales, headers: SALE_HEADERS },
] as const;

let structureReady: Promise<void> | null = null;

async function ensureSpreadsheetStructure(
  client: sheets_v4.Sheets,
): Promise<void> {
  const spreadsheetId = getSheetId();
  const meta = await client.spreadsheets.get({ spreadsheetId });
  const existing = new Set(
    meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) ?? [],
  );

  const missing = TAB_DEFINITIONS.filter((t) => !existing.has(t.name));
  if (missing.length > 0) {
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missing.map((t) => ({
          addSheet: { properties: { title: t.name } },
        })),
      },
    });
  }

  for (const tab of TAB_DEFINITIONS) {
    try {
      const rows = await getRowsUnsafe(client, tab.name);
      if (rows.length === 0) {
        await client.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tab.name.replace(/'/g, "''")}'!A1`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[...tab.headers]] },
        });
      }
    } catch {
      await client.spreadsheets.values.update({
        spreadsheetId,
        range: `'${tab.name.replace(/'/g, "''")}'!A1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[...tab.headers]] },
      });
    }
  }
}

function readyStructure(client: sheets_v4.Sheets): Promise<void> {
  if (!structureReady) {
    structureReady = ensureSpreadsheetStructure(client).catch((err) => {
      structureReady = null;
      throw err;
    });
  }
  return structureReady;
}

/** Read rows without running structure setup (internal). */
async function getRowsUnsafe(
  client: sheets_v4.Sheets,
  tab: string,
): Promise<string[][]> {
  const res = await client.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${tab.replace(/'/g, "''")}'!A:Z`,
  });
  return (res.data.values as string[][]) ?? [];
}

async function getRows(
  client: sheets_v4.Sheets,
  tab: string,
): Promise<string[][]> {
  await readyStructure(client);
  return getRowsUnsafe(client, tab);
}

async function appendRow(
  client: sheets_v4.Sheets,
  tab: string,
  values: string[],
) {
  await readyStructure(client);
  await client.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `'${tab.replace(/'/g, "''")}'!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

async function updateRow(
  client: sheets_v4.Sheets,
  tab: string,
  rowIndex: number,
  values: string[],
) {
  await readyStructure(client);
  await client.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `'${tab.replace(/'/g, "''")}'!A${rowIndex}:Z${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

async function deleteRow(
  client: sheets_v4.Sheets,
  tab: string,
  rowIndex: number,
) {
  await readyStructure(client);
  const meta = await client.spreadsheets.get({
    spreadsheetId: getSheetId(),
  });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === tab);
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined) throw new Error(`Sheet tab "${tab}" not found`);

  await client.spreadsheets.batchUpdate({
    spreadsheetId: getSheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}

function rowToProduct(row: string[]): Product {
  return {
    id: row[0] ?? "",
    name: row[1] ?? "",
    sku: row[2] ?? "",
    category: row[3] ?? "",
    quantity: Number(row[4] ?? 0),
    price: Number(row[5] ?? 0),
    barcode: Number(row[6] ?? 0),
    image: row[7] ?? "",
    lowStockThreshold: Number(row[8] ?? 5),
    createdAt: row[9] ?? "",
    updatedAt: row[10] ?? "",
  };
}

function productToRow(p: Product): string[] {
  return [
    p.id,
    p.name,
    p.sku ?? "",
    p.category,
    String(p.quantity),
    String(p.price),
    String(p.barcode),
    p.image,
    String(p.lowStockThreshold),
    p.createdAt,
    p.updatedAt,
  ];
}

function rowToHistory(row: string[]): InventoryHistoryEntry {
  return {
    id: row[0] ?? "",
    productId: row[1] ?? "",
    productName: row[2] ?? "",
    type: (row[3] ?? "adjustment") as InventoryHistoryEntry["type"],
    quantity: Number(row[4] ?? 0),
    previousQty: Number(row[5] ?? 0),
    newQty: Number(row[6] ?? 0),
    notes: row[7] ?? "",
    createdAt: row[8] ?? "",
  };
}

function historyToRow(h: InventoryHistoryEntry): string[] {
  return [
    h.id,
    h.productId,
    h.productName,
    h.type,
    String(h.quantity),
    String(h.previousQty),
    String(h.newQty),
    h.notes,
    h.createdAt,
  ];
}

function rowToPurchase(row: string[]): Purchase {
  return {
    id: row[0] ?? "",
    productId: row[1] ?? "",
    productName: row[2] ?? "",
    supplier: row[3] ?? "",
    quantity: Number(row[4] ?? 0),
    unitCost: Number(row[5] ?? 0),
    totalCost: Number(row[6] ?? 0),
    date: row[7] ?? "",
    notes: row[8] ?? "",
    createdAt: row[9] ?? "",
  };
}

function purchaseToRow(p: Purchase): string[] {
  return [
    p.id,
    p.productId,
    p.productName,
    p.supplier,
    String(p.quantity),
    String(p.unitCost),
    String(p.totalCost),
    p.date,
    p.notes,
    p.createdAt,
  ];
}

function rowToSale(row: string[]): Sale {
  return {
    id: row[0] ?? "",
    productId: row[1] ?? "",
    productName: row[2] ?? "",
    customer: row[3] ?? "",
    mobile: row[4] ? Number(row[4]) : null,
    quantity: Number(row[5] ?? 0),
    unitPrice: Number(row[6] ?? 0),
    totalPrice: Number(row[7] ?? 0),
    date: row[8] ?? "",
    notes: row[9] ?? "",
    createdAt: row[10] ?? "",
  };
}

function saleToRow(s: Sale): string[] {
  return [
    s.id,
    s.productId,
    s.productName,
    s.customer,
    s.mobile ? String(s.mobile) : "",
    String(s.quantity),
    String(s.unitPrice),
    String(s.totalPrice),
    s.date,
    s.notes,
    s.createdAt,
  ];
}

export async function ensureSheetHeaders() {
  const client = await getClient();
  structureReady = null;
  await ensureSpreadsheetStructure(client);
}

// ——— Products ———

export async function getAllProducts(): Promise<Product[]> {
  const client = await getClient();
  const rows = await getRows(client, SHEET_TABS.products);
  if (rows.length <= 1) return [];
  return rows.slice(1).filter((r) => r[0]).map(rowToProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find((p) => p.id === id) ?? null;
}

export async function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">,
): Promise<Product> {
  const client = await getClient();
  const now = new Date().toISOString();
  const product: Product = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await appendRow(client, SHEET_TABS.products, productToRow(product));
  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>,
): Promise<Product | null> {
  const client = await getClient();
  const rows = await getRows(client, SHEET_TABS.products);
  const index = rows.findIndex((r, i) => i > 0 && r[0] === id);
  if (index === -1) return null;

  const existing = rowToProduct(rows[index]);
  const updated: Product = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await updateRow(client, SHEET_TABS.products, index + 1, productToRow(updated));
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const client = await getClient();
  const rows = await getRows(client, SHEET_TABS.products);
  const index = rows.findIndex((r, i) => i > 0 && r[0] === id);
  if (index === -1) return false;
  await deleteRow(client, SHEET_TABS.products, index + 1);
  return true;
}

// ——— History ———

export async function getInventoryHistory(): Promise<InventoryHistoryEntry[]> {
  const client = await getClient();
  const rows = await getRows(client, SHEET_TABS.history);
  if (rows.length <= 1) return [];
  return rows
    .slice(1)
    .filter((r) => r[0])
    .map(rowToHistory)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function addHistoryEntry(
  entry: Omit<InventoryHistoryEntry, "id" | "createdAt">,
): Promise<InventoryHistoryEntry> {
  const client = await getClient();
  const full: InventoryHistoryEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  await appendRow(client, SHEET_TABS.history, historyToRow(full));
  return full;
}

export async function adjustProductStock(
  productId: string,
  delta: number,
  type: InventoryHistoryEntry["type"],
  notes = "",
): Promise<Product | null> {
  const product = await getProductById(productId);
  if (!product) return null;

  const previousQty = product.quantity;
  const newQty = Math.max(0, previousQty + delta);
  const updated = await updateProduct(productId, { quantity: newQty });

  if (updated) {
    await addHistoryEntry({
      productId,
      productName: product.name,
      type,
      quantity: Math.abs(delta),
      previousQty,
      newQty,
      notes,
    });
  }
  return updated;
}

// ——— Purchases ———

export async function getAllPurchases(): Promise<Purchase[]> {
  const client = await getClient();
  const rows = await getRows(client, SHEET_TABS.purchases);
  if (rows.length <= 1) return [];
  return rows
    .slice(1)
    .filter((r) => r[0])
    .map(rowToPurchase)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function createPurchase(
  data: Omit<Purchase, "id" | "productName" | "totalCost" | "createdAt"> & {
    productName?: string;
  },
): Promise<Purchase> {
  const product = await getProductById(data.productId);
  if (!product) throw new Error("Product not found");

  const totalCost = data.quantity * data.unitCost;
  const purchase: Purchase = {
    id: generateId(),
    productId: data.productId,
    productName: product.name,
    supplier: data.supplier,
    quantity: data.quantity,
    unitCost: data.unitCost,
    totalCost,
    date: data.date,
    notes: data.notes ?? "",
    createdAt: new Date().toISOString(),
  };

  const client = await getClient();
  await appendRow(client, SHEET_TABS.purchases, purchaseToRow(purchase));
  await adjustProductStock(
    data.productId,
    data.quantity,
    "purchase",
    `Purchase from ${data.supplier}`,
  );
  return purchase;
}

// ——— Sales ———

export async function getAllSales(): Promise<Sale[]> {
  const client = await getClient();
  const rows = await getRows(client, SHEET_TABS.sales);
  if (rows.length <= 1) return [];
  return rows
    .slice(1)
    .filter((r) => r[0])
    .map(rowToSale)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function createSale(
  data: Omit<Sale, "id" | "productName" | "totalPrice" | "createdAt"> & {
    productName?: string;
  },
): Promise<Sale> {
  const product = await getProductById(data.productId);
  if (!product) throw new Error("Product not found");
  if (product.quantity < data.quantity) {
    throw new Error("Insufficient stock for this sale");
  }

  const totalPrice = data.quantity * data.unitPrice;
  const sale: Sale = {
    id: generateId(),
    productId: data.productId,
    productName: product.name,
    customer: data.customer,
    mobile: data.mobile ?? null,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    totalPrice,
    date: data.date,
    notes: data.notes ?? "",
    createdAt: new Date().toISOString(),
  };

  const client = await getClient();
  await appendRow(client, SHEET_TABS.sales, saleToRow(sale));
  await adjustProductStock(
    data.productId,
    -data.quantity,
    "sale",
    `Sale to ${data.customer}`,
  );
  return sale;
}

export async function createBulkSales(data: {
  customer: string;
  mobile?: number;
  date: string;
  notes?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
}): Promise<Sale[]> {
  const totals = new Map<string, number>();
  for (const item of data.items) {
    totals.set(
      item.productId,
      (totals.get(item.productId) ?? 0) + item.quantity,
    );
  }

  for (const [productId, qty] of totals) {
    const product = await getProductById(productId);
    if (!product) throw new Error("Product not found");
    if (product.quantity < qty) {
      throw new Error(`Insufficient stock for ${product.name} (need ${qty}, have ${product.quantity})`);
    }
  }

  const orderRef = generateId().slice(0, 8).toUpperCase();
  const baseNotes = data.notes?.trim() ?? "";
  const orderNote = baseNotes
    ? `${baseNotes} · Order ${orderRef}`
    : `Order ${orderRef}`;

  const sales: Sale[] = [];
  for (const item of data.items) {
    const sale = await createSale({
      productId: item.productId,
      customer: data.customer,
      mobile: data.mobile !== undefined ? data.mobile : null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      date: data.date,
      notes: orderNote,
    });
    sales.push(sale);
  }
  return sales;
}

export { PRODUCT_HEADERS, HISTORY_HEADERS, PURCHASE_HEADERS, SALE_HEADERS };
