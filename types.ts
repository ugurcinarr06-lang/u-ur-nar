// ─── App Modules ───────────────────────────────────────────────────────────────
export type AppModule = 'LANDING' | 'MIRROR' | 'MOBILE' | 'ADMIN' | 'ARCHITECTURE';

// ─── Mirror ────────────────────────────────────────────────────────────────────
export type MirrorState =
  | 'IDLE'
  | 'QR_DISPLAYED'
  | 'SESSION_CONNECTING'
  | 'SESSION_ACTIVE'
  | 'TRYON_ACTIVE'
  | 'SCREENSAVER';

// ─── Mobile ────────────────────────────────────────────────────────────────────
export type MobileView =
  | 'SESSION_SCAN'
  | 'SESSION_CONNECTING'
  | 'CATALOG'
  | 'PRODUCT_DETAIL'
  | 'FAVORITES'
  | 'CART';

// ─── Admin ─────────────────────────────────────────────────────────────────────
export type AdminView =
  | 'DASHBOARD'
  | 'PRODUCTS'
  | 'STORES'
  | 'MIRRORS'
  | 'ANALYTICS'
  | 'USERS'
  | 'SUBSCRIPTIONS'
  | 'SETTINGS';

// ─── RBAC ──────────────────────────────────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'STORE_MANAGER' | 'STAFF';
export type SubscriptionPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type StatusEntity = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL';
export type OnlineStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'MAINTENANCE';

// ─── Entities ──────────────────────────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  logo: string;
  logoColor: string;
  plan: SubscriptionPlan;
  storeCount: number;
  mirrorCount: number;
  monthlyRevenue: number;
  totalSessions: number;
  status: StatusEntity;
  createdAt: string;
  country: string;
}

export interface Store {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  address: string;
  city: string;
  country: string;
  mirrorCount: number;
  activeSessions: number;
  dailyVisitors: number;
  weeklyTryOns: number;
  conversionRate: number;
  status: OnlineStatus;
  openedAt: string;
}

export interface Mirror {
  id: string;
  storeId: string;
  storeName: string;
  serialNumber: string;
  locationLabel: string;
  status: OnlineStatus;
  currentSessionId: string | null;
  uptimePercent: number;
  totalSessionsAllTime: number;
  lastSeenAt: string;
  firmwareVersion: string;
  cpuUsage: number;
  memUsage: number;
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  colorId: string;
  size: string;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  imageGradient: string;
  colors: ProductColor[];
  sizes: string[];
  tags: string[];
  tryOnCount: number;
  favoriteCount: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isNew: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  productCount: number;
  color: string;
}

export interface Session {
  id: string;
  mirrorId: string;
  storeId: string;
  qrCode: string;
  startedAt: string;
  endedAt?: string;
  status: 'WAITING' | 'ACTIVE' | 'ENDED';
  selectedProductId?: string;
  selectedColorId?: string;
  selectedSize?: string;
  events: SessionEvent[];
}

export interface SessionEvent {
  id: string;
  type: SessionEventType;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export type SessionEventType =
  | 'QR_SCANNED'
  | 'SESSION_CONNECTED'
  | 'PRODUCT_SELECTED'
  | 'COLOR_CHANGED'
  | 'SIZE_CHANGED'
  | 'TRYON_STARTED'
  | 'TRYON_COMPLETED'
  | 'FAVORITE_ADDED'
  | 'CART_ADDED'
  | 'SESSION_ENDED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  storeId?: string;
  storeName?: string;
  avatarInitials: string;
  avatarColor: string;
  lastLoginAt: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

// ─── Analytics ─────────────────────────────────────────────────────────────────
export interface DailyAnalytics {
  date: string;
  visitors: number;
  sessions: number;
  tryOns: number;
  conversions: number;
  revenue: number;
}

export interface ProductAnalytics {
  productId: string;
  productName: string;
  tryOnCount: number;
  favoriteCount: number;
  conversionCount: number;
  conversionRate: number;
}

export interface KPIData {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: string;
  color: string;
}

// ─── Subscription ──────────────────────────────────────────────────────────────
export interface SubscriptionTier {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  mirrorLimit: number;
  storeLimit: number;
  features: string[];
  isPopular?: boolean;
  color: string;
}

// ─── Architecture ──────────────────────────────────────────────────────────────
export interface ArchModule {
  id: string;
  name: string;
  tech: string[];
  description: string;
  color: string;
  icon: string;
}

export interface DBTable {
  name: string;
  columns: DBColumn[];
  description: string;
}

export interface DBColumn {
  name: string;
  type: string;
  constraint?: string;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  auth: boolean;
  roles?: UserRole[];
}

export interface WSEvent {
  name: SessionEventType;
  direction: 'EMIT' | 'LISTEN' | 'BOTH';
  description: string;
  payload: string;
}
