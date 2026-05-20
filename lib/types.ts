export type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  quantity: number;
  price: number;
  barcode: number;
  image: string;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
};

export type InventoryHistoryEntry = {
  id: string;
  productId: string;
  productName: string;
  type: "stock_in" | "stock_out" | "adjustment" | "purchase" | "sale";
  quantity: number;
  previousQty: number;
  newQty: number;
  notes: string;
  createdAt: string;
};

export type Purchase = {
  id: string;
  productId: string;
  productName: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  notes: string;
  createdAt: string;
};

export type Sale = {
  id: string;
  productId: string;
  productName: string;
  customer: string;
  mobile: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  notes: string;
  createdAt: string;
};

export type DashboardStats = {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  recentActivity: InventoryHistoryEntry[];
  categoryBreakdown: { category: string; count: number; value: number }[];
  stockTrend: { date: string; stockIn: number; stockOut: number }[];
};

export type StockMovementInput = {
  productId: string;
  quantity: number;
  notes?: string;
};

export type ApiError = {
  error: string;
};
