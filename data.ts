import {
  Company, Store, Mirror, Product, Category, User, DailyAnalytics,
  ProductAnalytics, KPIData, SubscriptionTier, ArchModule, DBTable, APIEndpoint, WSEvent
} from './types';

// ─── Categories ────────────────────────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'T-Shirts', icon: '👕', productCount: 48, color: '#3b82f6' },
  { id: 'cat-2', name: 'Shirts', icon: '👔', productCount: 35, color: '#8b5cf6' },
  { id: 'cat-3', name: 'Dresses', icon: '👗', productCount: 42, color: '#ec4899' },
  { id: 'cat-4', name: 'Jackets', icon: '🧥', productCount: 29, color: '#f59e0b' },
  { id: 'cat-5', name: 'Suits', icon: '🤵', productCount: 18, color: '#06b6d4' },
  { id: 'cat-6', name: 'Shoes', icon: '👠', productCount: 55, color: '#22c55e' },
  { id: 'cat-7', name: 'Accessories', icon: '👜', productCount: 67, color: '#ef4444' },
];

// ─── Products ──────────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  {
    id: 'p-001', categoryId: 'cat-2', categoryName: 'Shirts',
    name: 'Milano Premium Shirt', brand: 'Versace Collection',
    description: 'Hand-crafted Italian silk shirt with mother-of-pearl buttons. Tailored fit for the modern executive.',
    price: 289, originalPrice: 420, currency: '$',
    imageUrl: '', imageGradient: 'from-blue-900 via-blue-700 to-blue-500',
    colors: [
      { id: 'c1', name: 'Midnight Blue', hex: '#1e3a5f' },
      { id: 'c2', name: 'Pearl White', hex: '#f8f8f8' },
      { id: 'c3', name: 'Charcoal', hex: '#2d2d2d' },
      { id: 'c4', name: 'Royal Burgundy', hex: '#6d1a36' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    tags: ['luxury', 'silk', 'italian', 'formal'],
    tryOnCount: 1847, favoriteCount: 423, rating: 4.8, reviewCount: 312,
    isAvailable: true, isFeatured: true, isNew: false,
  },
  {
    id: 'p-002', categoryId: 'cat-5', categoryName: 'Suits',
    name: 'Savile Row Power Suit', brand: 'Armani Exchange',
    description: 'Double-breasted wool blend suit with a slim cut. The epitome of boardroom authority.',
    price: 1240, originalPrice: 1890, currency: '$',
    imageUrl: '', imageGradient: 'from-gray-900 via-gray-700 to-gray-600',
    colors: [
      { id: 'c1', name: 'Anthracite', hex: '#2c2c2c' },
      { id: 'c2', name: 'Navy Pinstripe', hex: '#1a2a4a' },
      { id: 'c3', name: 'Slate Grey', hex: '#4a5568' },
    ],
    sizes: ['46', '48', '50', '52', '54', '56'],
    tags: ['luxury', 'wool', 'business', 'formal'],
    tryOnCount: 956, favoriteCount: 281, rating: 4.9, reviewCount: 187,
    isAvailable: true, isFeatured: true, isNew: false,
  },
  {
    id: 'p-003', categoryId: 'cat-3', categoryName: 'Dresses',
    name: 'Celestine Evening Gown', brand: 'Valentino',
    description: 'Flowing chiffon evening gown with hand-embroidered floral motifs. Made for unforgettable moments.',
    price: 2100, currency: '$',
    imageUrl: '', imageGradient: 'from-rose-900 via-rose-600 to-pink-400',
    colors: [
      { id: 'c1', name: 'Scarlet Rose', hex: '#be123c' },
      { id: 'c2', name: 'Midnight Black', hex: '#0a0a0a' },
      { id: 'c3', name: 'Champagne', hex: '#e8d5b7' },
      { id: 'c4', name: 'Sapphire', hex: '#1e40af' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    tags: ['luxury', 'chiffon', 'evening', 'gown'],
    tryOnCount: 2341, favoriteCount: 891, rating: 4.9, reviewCount: 445,
    isAvailable: true, isFeatured: true, isNew: true,
  },
  {
    id: 'p-004', categoryId: 'cat-4', categoryName: 'Jackets',
    name: 'Heritage Leather Moto', brand: 'Saint Laurent',
    description: 'Genuine Italian nappa leather jacket with YKK hardware. A timeless rebellion.',
    price: 3200, currency: '$',
    imageUrl: '', imageGradient: 'from-stone-900 via-stone-700 to-stone-500',
    colors: [
      { id: 'c1', name: 'Jet Black', hex: '#0a0a0a' },
      { id: 'c2', name: 'Cognac', hex: '#8B4513' },
      { id: 'c3', name: 'Deep Forest', hex: '#1a3a2a' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    tags: ['luxury', 'leather', 'moto', 'iconic'],
    tryOnCount: 3102, favoriteCount: 1204, rating: 4.7, reviewCount: 678,
    isAvailable: true, isFeatured: true, isNew: false,
  },
  {
    id: 'p-005', categoryId: 'cat-1', categoryName: 'T-Shirts',
    name: 'Supima Supreme Tee', brand: 'Loro Piana',
    description: '100% Supima cotton with a luxuriously soft hand feel. Minimalist luxury at its finest.',
    price: 195, currency: '$',
    imageUrl: '', imageGradient: 'from-emerald-900 via-emerald-700 to-emerald-500',
    colors: [
      { id: 'c1', name: 'Forest Green', hex: '#166534' },
      { id: 'c2', name: 'Ecru', hex: '#f5f0e8' },
      { id: 'c3', name: 'Dusty Rose', hex: '#c084a0' },
      { id: 'c4', name: 'Navy', hex: '#1e3a8a' },
      { id: 'c5', name: 'Slate', hex: '#475569' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    tags: ['luxury', 'cotton', 'minimal', 'premium'],
    tryOnCount: 4521, favoriteCount: 1876, rating: 4.6, reviewCount: 1203,
    isAvailable: true, isFeatured: false, isNew: true,
  },
  {
    id: 'p-006', categoryId: 'cat-6', categoryName: 'Shoes',
    name: 'Monaco Oxford Derby', brand: 'John Lobb',
    description: 'Bespoke Goodyear-welted oxfords in Annonay box calf leather. Handmade in Northampton.',
    price: 890, currency: '$',
    imageUrl: '', imageGradient: 'from-amber-900 via-amber-700 to-amber-500',
    colors: [
      { id: 'c1', name: 'Mahogany', hex: '#5C1A0E' },
      { id: 'c2', name: 'Black', hex: '#0a0a0a' },
      { id: 'c3', name: 'Tan', hex: '#c4a468' },
    ],
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
    tags: ['luxury', 'leather', 'oxford', 'handmade'],
    tryOnCount: 1234, favoriteCount: 445, rating: 4.8, reviewCount: 289,
    isAvailable: true, isFeatured: true, isNew: false,
  },
  {
    id: 'p-007', categoryId: 'cat-3', categoryName: 'Dresses',
    name: 'Riviera Wrap Dress', brand: 'Diane von Furstenberg',
    description: 'The iconic wrap dress reimagined. Silk jersey with an exclusive geometric print.',
    price: 445, currency: '$',
    imageUrl: '', imageGradient: 'from-violet-900 via-violet-700 to-purple-500',
    colors: [
      { id: 'c1', name: 'Geometric Violet', hex: '#5b21b6' },
      { id: 'c2', name: 'Ivory Floral', hex: '#faf0e6' },
      { id: 'c3', name: 'Emerald Grid', hex: '#065f46' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    tags: ['iconic', 'silk', 'wrap', 'print'],
    tryOnCount: 2891, favoriteCount: 1023, rating: 4.7, reviewCount: 534,
    isAvailable: true, isFeatured: false, isNew: false,
  },
  {
    id: 'p-008', categoryId: 'cat-7', categoryName: 'Accessories',
    name: 'Obsidian Silk Scarf', brand: 'Hermès',
    description: 'Hand-rolled 90cm twill silk scarf featuring the iconic Carré print. A lifetime investment.',
    price: 485, currency: '$',
    imageUrl: '', imageGradient: 'from-orange-900 via-orange-700 to-orange-400',
    colors: [
      { id: 'c1', name: 'Orange Classic', hex: '#ea580c' },
      { id: 'c2', name: 'Marine Blue', hex: '#0c4a6e' },
      { id: 'c3', name: 'Forest', hex: '#14532d' },
    ],
    sizes: ['90cm', '140cm'],
    tags: ['luxury', 'silk', 'iconic', 'investment'],
    tryOnCount: 789, favoriteCount: 334, rating: 5.0, reviewCount: 156,
    isAvailable: true, isFeatured: true, isNew: false,
  },
];

// ─── Companies ─────────────────────────────────────────────────────────────────
export const COMPANIES: Company[] = [
  {
    id: 'co-001', name: 'LUXE Fashion Group', logo: 'LF',
    logoColor: '#f59e0b', plan: 'ENTERPRISE',
    storeCount: 47, mirrorCount: 138, monthlyRevenue: 284000,
    totalSessions: 189420, status: 'ACTIVE',
    createdAt: '2023-03-15', country: 'United States',
  },
  {
    id: 'co-002', name: 'Blanc & Noir Paris', logo: 'BN',
    logoColor: '#8b5cf6', plan: 'ENTERPRISE',
    storeCount: 23, mirrorCount: 67, monthlyRevenue: 142000,
    totalSessions: 89340, status: 'ACTIVE',
    createdAt: '2023-06-01', country: 'France',
  },
  {
    id: 'co-003', name: 'Atlas Retail TUR', logo: 'AR',
    logoColor: '#3b82f6', plan: 'PROFESSIONAL',
    storeCount: 12, mirrorCount: 34, monthlyRevenue: 67000,
    totalSessions: 45210, status: 'ACTIVE',
    createdAt: '2023-09-20', country: 'Turkey',
  },
  {
    id: 'co-004', name: 'Sakura Mode Tokyo', logo: 'SM',
    logoColor: '#ec4899', plan: 'PROFESSIONAL',
    storeCount: 8, mirrorCount: 22, monthlyRevenue: 38000,
    totalSessions: 29870, status: 'ACTIVE',
    createdAt: '2024-01-10', country: 'Japan',
  },
  {
    id: 'co-005', name: 'Dune Boutique', logo: 'DB',
    logoColor: '#22c55e', plan: 'STARTER',
    storeCount: 2, mirrorCount: 4, monthlyRevenue: 8200,
    totalSessions: 6140, status: 'TRIAL',
    createdAt: '2024-05-02', country: 'UAE',
  },
];

// ─── Stores ────────────────────────────────────────────────────────────────────
export const STORES: Store[] = [
  {
    id: 'st-001', companyId: 'co-001', companyName: 'LUXE Fashion Group',
    name: 'Fifth Avenue Flagship', address: '680 Fifth Avenue',
    city: 'New York', country: 'USA', mirrorCount: 8, activeSessions: 5,
    dailyVisitors: 1240, weeklyTryOns: 4891, conversionRate: 23.4,
    status: 'ONLINE', openedAt: '2023-04-01',
  },
  {
    id: 'st-002', companyId: 'co-001', companyName: 'LUXE Fashion Group',
    name: 'Rodeo Drive Beverly Hills', address: '9500 Wilshire Blvd',
    city: 'Los Angeles', country: 'USA', mirrorCount: 6, activeSessions: 3,
    dailyVisitors: 890, weeklyTryOns: 3124, conversionRate: 28.1,
    status: 'ONLINE', openedAt: '2023-07-15',
  },
  {
    id: 'st-003', companyId: 'co-002', companyName: 'Blanc & Noir Paris',
    name: 'Champs-Élysées Boutique', address: '72 Avenue des Champs-Élysées',
    city: 'Paris', country: 'France', mirrorCount: 5, activeSessions: 2,
    dailyVisitors: 2100, weeklyTryOns: 7234, conversionRate: 19.2,
    status: 'ONLINE', openedAt: '2023-08-01',
  },
  {
    id: 'st-004', companyId: 'co-003', companyName: 'Atlas Retail TUR',
    name: 'İstiklal Avenue Store', address: 'İstiklal Cad. No:234',
    city: 'Istanbul', country: 'Turkey', mirrorCount: 4, activeSessions: 1,
    dailyVisitors: 780, weeklyTryOns: 2890, conversionRate: 21.7,
    status: 'ONLINE', openedAt: '2023-10-15',
  },
  {
    id: 'st-005', companyId: 'co-004', companyName: 'Sakura Mode Tokyo',
    name: 'Shibuya Crossing', address: '2-24-1 Shibuya',
    city: 'Tokyo', country: 'Japan', mirrorCount: 3, activeSessions: 2,
    dailyVisitors: 1450, weeklyTryOns: 5102, conversionRate: 31.2,
    status: 'ONLINE', openedAt: '2024-02-01',
  },
  {
    id: 'st-006', companyId: 'co-001', companyName: 'LUXE Fashion Group',
    name: 'Chicago Magnificent Mile', address: '900 N Michigan Ave',
    city: 'Chicago', country: 'USA', mirrorCount: 5, activeSessions: 0,
    dailyVisitors: 620, weeklyTryOns: 1987, conversionRate: 18.9,
    status: 'OFFLINE', openedAt: '2023-11-01',
  },
];

// ─── Mirrors ───────────────────────────────────────────────────────────────────
export const MIRRORS: Mirror[] = [
  {
    id: 'mir-001', storeId: 'st-001', storeName: 'Fifth Avenue Flagship',
    serialNumber: 'SM-2024-001A', locationLabel: 'Entrance — Zone A',
    status: 'BUSY', currentSessionId: 'ses-active-1',
    uptimePercent: 99.8, totalSessionsAllTime: 12420, lastSeenAt: '2 sec ago',
    firmwareVersion: '3.2.1', cpuUsage: 68, memUsage: 54,
  },
  {
    id: 'mir-002', storeId: 'st-001', storeName: 'Fifth Avenue Flagship',
    serialNumber: 'SM-2024-002A', locationLabel: "Women's Floor — Zone B",
    status: 'ONLINE', currentSessionId: null,
    uptimePercent: 99.5, totalSessionsAllTime: 10891, lastSeenAt: '1 min ago',
    firmwareVersion: '3.2.1', cpuUsage: 12, memUsage: 31,
  },
  {
    id: 'mir-003', storeId: 'st-002', storeName: 'Rodeo Drive Beverly Hills',
    serialNumber: 'SM-2024-003B', locationLabel: 'VIP Suite',
    status: 'BUSY', currentSessionId: 'ses-active-2',
    uptimePercent: 99.9, totalSessionsAllTime: 8234, lastSeenAt: '5 sec ago',
    firmwareVersion: '3.2.1', cpuUsage: 72, memUsage: 61,
  },
  {
    id: 'mir-004', storeId: 'st-003', storeName: 'Champs-Élysées Boutique',
    serialNumber: 'SM-2024-004C', locationLabel: 'Main Floor',
    status: 'ONLINE', currentSessionId: null,
    uptimePercent: 98.2, totalSessionsAllTime: 15670, lastSeenAt: '30 sec ago',
    firmwareVersion: '3.1.8', cpuUsage: 9, memUsage: 28,
  },
  {
    id: 'mir-005', storeId: 'st-004', storeName: 'İstiklal Avenue Store',
    serialNumber: 'SM-2024-005D', locationLabel: 'Ground Floor — Center',
    status: 'MAINTENANCE', currentSessionId: null,
    uptimePercent: 94.1, totalSessionsAllTime: 7890, lastSeenAt: '2 hr ago',
    firmwareVersion: '3.0.4', cpuUsage: 0, memUsage: 15,
  },
];

// ─── Users ─────────────────────────────────────────────────────────────────────
export const USERS: User[] = [
  {
    id: 'u-001', email: 'admin@siriusmirror.io', name: 'Alex Chen',
    role: 'SUPER_ADMIN', companyId: 'co-000', companyName: 'Sirius Mirror',
    avatarInitials: 'AC', avatarColor: '#3b82f6',
    lastLoginAt: '5 min ago', status: 'ACTIVE', createdAt: '2023-01-01',
  },
  {
    id: 'u-002', email: 'ceo@luxefashion.com', name: 'Sarah Williams',
    role: 'COMPANY_ADMIN', companyId: 'co-001', companyName: 'LUXE Fashion Group',
    avatarInitials: 'SW', avatarColor: '#f59e0b',
    lastLoginAt: '1 hr ago', status: 'ACTIVE', createdAt: '2023-03-15',
  },
  {
    id: 'u-003', email: 'manager@luxefashion.com', name: 'Marcus Johnson',
    role: 'STORE_MANAGER', companyId: 'co-001', companyName: 'LUXE Fashion Group',
    storeId: 'st-001', storeName: 'Fifth Avenue Flagship',
    avatarInitials: 'MJ', avatarColor: '#22c55e',
    lastLoginAt: '3 hr ago', status: 'ACTIVE', createdAt: '2023-04-01',
  },
  {
    id: 'u-004', email: 'staff@luxefashion.com', name: 'Emma Davis',
    role: 'STAFF', companyId: 'co-001', companyName: 'LUXE Fashion Group',
    storeId: 'st-001', storeName: 'Fifth Avenue Flagship',
    avatarInitials: 'ED', avatarColor: '#ec4899',
    lastLoginAt: '2 days ago', status: 'ACTIVE', createdAt: '2023-05-10',
  },
  {
    id: 'u-005', email: 'admin@blancnoir.fr', name: 'Sophie Dubois',
    role: 'COMPANY_ADMIN', companyId: 'co-002', companyName: 'Blanc & Noir Paris',
    avatarInitials: 'SD', avatarColor: '#8b5cf6',
    lastLoginAt: '30 min ago', status: 'ACTIVE', createdAt: '2023-06-01',
  },
  {
    id: 'u-006', email: 'admin@atlasretail.com.tr', name: 'Mehmet Yılmaz',
    role: 'COMPANY_ADMIN', companyId: 'co-003', companyName: 'Atlas Retail TUR',
    avatarInitials: 'MY', avatarColor: '#06b6d4',
    lastLoginAt: '6 hr ago', status: 'ACTIVE', createdAt: '2023-09-20',
  },
];

// ─── Analytics Data ─────────────────────────────────────────────────────────────
export const generateAnalytics = (days: number = 30): DailyAnalytics[] => {
  const data: DailyAnalytics[] = [];
  const base = new Date('2026-05-20');
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const weekday = d.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const multiplier = isWeekend ? 1.6 : 1.0;
    const trend = 1 + (i / days) * 0.2;
    const visitors = Math.round((820 + Math.random() * 380) * multiplier * trend);
    const sessions = Math.round(visitors * (0.72 + Math.random() * 0.1));
    const tryOns = Math.round(sessions * (0.81 + Math.random() * 0.1));
    const conversions = Math.round(tryOns * (0.22 + Math.random() * 0.08));
    data.push({
      date: d.toISOString().split('T')[0],
      visitors, sessions, tryOns, conversions,
      revenue: Math.round(conversions * (185 + Math.random() * 120)),
    });
  }
  return data;
};

export const ANALYTICS_30D = generateAnalytics(30);

export const TOP_PRODUCTS: ProductAnalytics[] = [
  { productId: 'p-004', productName: 'Heritage Leather Moto', tryOnCount: 3102, favoriteCount: 1204, conversionCount: 621, conversionRate: 20.0 },
  { productId: 'p-003', productName: 'Celestine Evening Gown', tryOnCount: 2341, favoriteCount: 891, conversionCount: 492, conversionRate: 21.0 },
  { productId: 'p-007', productName: 'Riviera Wrap Dress', tryOnCount: 2891, favoriteCount: 1023, conversionCount: 578, conversionRate: 20.0 },
  { productId: 'p-005', productName: 'Supima Supreme Tee', tryOnCount: 4521, favoriteCount: 1876, conversionCount: 814, conversionRate: 18.0 },
  { productId: 'p-001', productName: 'Milano Premium Shirt', tryOnCount: 1847, favoriteCount: 423, conversionCount: 351, conversionRate: 19.0 },
];

export const DASHBOARD_KPIS: KPIData[] = [
  { label: 'Total Sessions', value: '48,291', change: 18.4, changeLabel: 'vs last month', icon: '📱', color: '#3b82f6' },
  { label: 'Virtual Try-Ons', value: '38,716', change: 24.1, changeLabel: 'vs last month', icon: '🪞', color: '#8b5cf6' },
  { label: 'Active Mirrors', value: '312', change: 12.0, changeLabel: 'vs last month', icon: '⚡', color: '#22c55e' },
  { label: 'Conversion Rate', value: '23.4%', change: 5.2, changeLabel: 'vs last month', icon: '📈', color: '#f59e0b' },
  { label: 'Monthly Revenue', value: '$539K', change: 31.7, changeLabel: 'vs last month', icon: '💰', color: '#06b6d4' },
  { label: 'Active Companies', value: '94', change: 8.0, changeLabel: 'vs last month', icon: '🏢', color: '#ec4899' },
];

// ─── Subscription Tiers ─────────────────────────────────────────────────────────
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'STARTER', name: 'Starter', price: 299, currency: '$', period: 'monthly',
    mirrorLimit: 4, storeLimit: 2,
    features: [
      'Up to 4 smart mirrors', '2 store locations', 'Basic analytics',
      'Product catalog management', 'Mobile web app', 'Email support',
    ],
    color: '#22c55e',
  },
  {
    id: 'PROFESSIONAL', name: 'Professional', price: 899, currency: '$', period: 'monthly',
    mirrorLimit: 25, storeLimit: 10, isPopular: true,
    features: [
      'Up to 25 smart mirrors', '10 store locations', 'Advanced analytics',
      'AI Virtual Try-On (API mode)', 'Custom branding', 'Priority support',
      'Real-time WebSocket sync', 'Multi-user RBAC', 'Data export (CSV/PDF)',
    ],
    color: '#3b82f6',
  },
  {
    id: 'ENTERPRISE', name: 'Enterprise', price: 2999, currency: '$', period: 'monthly',
    mirrorLimit: 999, storeLimit: 999,
    features: [
      'Unlimited mirrors & stores', 'Self-hosted AI engine', '3D avatar try-on',
      'Body measurement AI', 'Dedicated infrastructure', '24/7 SLA support',
      'Custom integrations', 'White-label option', 'SOC 2 compliance',
      'GDPR/KVKK certified', 'Multi-region deployment',
    ],
    color: '#8b5cf6',
  },
];

// ─── Architecture ───────────────────────────────────────────────────────────────
export const ARCH_MODULES: ArchModule[] = [
  {
    id: 'mirror-client', name: 'Mirror Client', icon: '🪞',
    tech: ['React', 'Next.js', 'TypeScript', 'Socket.IO', 'Canvas API'],
    description: 'Fullscreen kiosk app running on embedded display hardware. Manages QR sessions, AI overlay rendering, and real-time sync.',
    color: '#3b82f6',
  },
  {
    id: 'mobile-app', name: 'Mobile Web App', icon: '📱',
    tech: ['React', 'Next.js', 'TypeScript', 'PWA', 'Socket.IO'],
    description: 'Progressive web app optimized for mobile. Product browsing, try-on control, cart, and favorites with offline support.',
    color: '#8b5cf6',
  },
  {
    id: 'admin-panel', name: 'Admin Panel', icon: '⚙️',
    tech: ['React', 'Next.js', 'TypeScript', 'Recharts', 'React Query'],
    description: 'Multi-tenant management dashboard with RBAC. Analytics, store management, product catalog, and billing.',
    color: '#f59e0b',
  },
  {
    id: 'api-server', name: 'API Server', icon: '🔌',
    tech: ['Node.js', 'Express', 'TypeScript', 'Socket.IO', 'Bull MQ'],
    description: 'RESTful API + WebSocket server. Handles auth, sessions, product management, analytics ingestion, and AI job queue.',
    color: '#22c55e',
  },
  {
    id: 'ai-engine', name: 'AI Engine', icon: '🤖',
    tech: ['Python', 'PyTorch', 'MediaPipe', 'OpenCV', 'FastAPI'],
    description: 'Virtual try-on AI with pose estimation, human segmentation, and garment fitting. Supports API mode (FASHN AI) and self-hosted.',
    color: '#ec4899',
  },
  {
    id: 'database', name: 'Database', icon: '🗄️',
    tech: ['PostgreSQL', 'Redis', 'Prisma ORM', 'TimescaleDB'],
    description: 'Multi-tenant PostgreSQL with row-level security. Redis for sessions and pub/sub. TimescaleDB for analytics time-series.',
    color: '#06b6d4',
  },
  {
    id: 'cdn-media', name: 'Media / CDN', icon: '🌐',
    tech: ['AWS S3', 'CloudFront', 'Sharp', 'FFmpeg'],
    description: 'Product images, garment assets, and video processing. Global CDN with edge caching for <50ms asset delivery.',
    color: '#f97316',
  },
  {
    id: 'devops', name: 'DevOps', icon: '🚀',
    tech: ['Docker', 'Kubernetes', 'GitHub Actions', 'Nginx', 'Prometheus'],
    description: 'Containerized microservices on Kubernetes. CI/CD with GitHub Actions, blue-green deployments, auto-scaling.',
    color: '#ef4444',
  },
];

export const DB_SCHEMA: DBTable[] = [
  {
    name: 'companies', description: 'Multi-tenant company accounts',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
      { name: 'name', type: 'VARCHAR(255)', constraint: 'NOT NULL' },
      { name: 'slug', type: 'VARCHAR(100)', constraint: 'UNIQUE NOT NULL' },
      { name: 'plan', type: 'subscription_plan', constraint: "NOT NULL DEFAULT 'STARTER'" },
      { name: 'status', type: 'company_status', constraint: "NOT NULL DEFAULT 'TRIAL'" },
      { name: 'settings', type: 'JSONB', constraint: "DEFAULT '{}'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraint: 'NOT NULL DEFAULT NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', constraint: 'NOT NULL DEFAULT NOW()' },
    ],
  },
  {
    name: 'stores', description: 'Physical retail store locations',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
      { name: 'company_id', type: 'UUID', constraint: 'NOT NULL REFERENCES companies(id)' },
      { name: 'name', type: 'VARCHAR(255)', constraint: 'NOT NULL' },
      { name: 'address', type: 'TEXT' },
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'country', type: 'VARCHAR(100)' },
      { name: 'timezone', type: 'VARCHAR(50)', constraint: "NOT NULL DEFAULT 'UTC'" },
      { name: 'status', type: 'online_status', constraint: "NOT NULL DEFAULT 'OFFLINE'" },
      { name: 'metadata', type: 'JSONB', constraint: "DEFAULT '{}'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraint: 'NOT NULL DEFAULT NOW()' },
    ],
  },
  {
    name: 'mirrors', description: 'Smart mirror hardware devices',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
      { name: 'store_id', type: 'UUID', constraint: 'NOT NULL REFERENCES stores(id)' },
      { name: 'serial_number', type: 'VARCHAR(100)', constraint: 'UNIQUE NOT NULL' },
      { name: 'location_label', type: 'VARCHAR(255)' },
      { name: 'status', type: 'mirror_status', constraint: "NOT NULL DEFAULT 'OFFLINE'" },
      { name: 'firmware_version', type: 'VARCHAR(20)' },
      { name: 'last_seen_at', type: 'TIMESTAMPTZ' },
      { name: 'config', type: 'JSONB', constraint: "DEFAULT '{}'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraint: 'NOT NULL DEFAULT NOW()' },
    ],
  },
  {
    name: 'sessions', description: 'Mirror-mobile pairing sessions',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
      { name: 'mirror_id', type: 'UUID', constraint: 'NOT NULL REFERENCES mirrors(id)' },
      { name: 'store_id', type: 'UUID', constraint: 'NOT NULL REFERENCES stores(id)' },
      { name: 'qr_token', type: 'VARCHAR(64)', constraint: 'UNIQUE NOT NULL' },
      { name: 'status', type: 'session_status', constraint: "NOT NULL DEFAULT 'WAITING'" },
      { name: 'started_at', type: 'TIMESTAMPTZ', constraint: 'NOT NULL DEFAULT NOW()' },
      { name: 'ended_at', type: 'TIMESTAMPTZ' },
      { name: 'metadata', type: 'JSONB', constraint: "DEFAULT '{}'" },
    ],
  },
  {
    name: 'products', description: 'Retailer product catalog',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
      { name: 'company_id', type: 'UUID', constraint: 'NOT NULL REFERENCES companies(id)' },
      { name: 'category_id', type: 'UUID', constraint: 'NOT NULL REFERENCES categories(id)' },
      { name: 'name', type: 'VARCHAR(255)', constraint: 'NOT NULL' },
      { name: 'description', type: 'TEXT' },
      { name: 'price', type: 'DECIMAL(12,2)', constraint: 'NOT NULL' },
      { name: 'currency', type: 'VARCHAR(3)', constraint: "NOT NULL DEFAULT 'USD'" },
      { name: 'is_available', type: 'BOOLEAN', constraint: 'NOT NULL DEFAULT TRUE' },
      { name: 'garment_asset_url', type: 'TEXT' },
      { name: 'metadata', type: 'JSONB', constraint: "DEFAULT '{}'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', constraint: 'NOT NULL DEFAULT NOW()' },
    ],
  },
  {
    name: 'analytics_events', description: 'User interaction events (TimescaleDB hypertable)',
    columns: [
      { name: 'time', type: 'TIMESTAMPTZ', constraint: 'NOT NULL' },
      { name: 'session_id', type: 'UUID', constraint: 'REFERENCES sessions(id)' },
      { name: 'store_id', type: 'UUID', constraint: 'NOT NULL REFERENCES stores(id)' },
      { name: 'event_type', type: 'VARCHAR(50)', constraint: 'NOT NULL' },
      { name: 'product_id', type: 'UUID', constraint: 'REFERENCES products(id)' },
      { name: 'payload', type: 'JSONB', constraint: "DEFAULT '{}'" },
    ],
  },
];

export const API_ENDPOINTS: APIEndpoint[] = [
  { method: 'POST', path: '/api/v1/auth/login', description: 'Authenticate user, return JWT', auth: false },
  { method: 'POST', path: '/api/v1/auth/refresh', description: 'Refresh access token', auth: false },
  { method: 'POST', path: '/api/v1/sessions', description: 'Create new mirror session, generate QR', auth: true, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
  { method: 'GET', path: '/api/v1/sessions/:id', description: 'Get session state', auth: true },
  { method: 'POST', path: '/api/v1/sessions/:id/connect', description: 'Connect mobile to session via QR token', auth: false },
  { method: 'GET', path: '/api/v1/products', description: 'List products with filtering & pagination', auth: true },
  { method: 'POST', path: '/api/v1/products', description: 'Create product', auth: true, roles: ['COMPANY_ADMIN', 'STORE_MANAGER'] },
  { method: 'PUT', path: '/api/v1/products/:id', description: 'Update product', auth: true, roles: ['COMPANY_ADMIN', 'STORE_MANAGER'] },
  { method: 'GET', path: '/api/v1/stores', description: 'List stores for company', auth: true, roles: ['COMPANY_ADMIN', 'STORE_MANAGER'] },
  { method: 'GET', path: '/api/v1/mirrors', description: 'List mirrors with status', auth: true },
  { method: 'GET', path: '/api/v1/analytics/overview', description: 'KPI overview data', auth: true, roles: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
  { method: 'GET', path: '/api/v1/analytics/timeseries', description: 'Time series analytics data', auth: true },
  { method: 'POST', path: '/api/v1/tryon', description: 'Submit try-on job to AI queue', auth: true },
  { method: 'GET', path: '/api/v1/tryon/:jobId', description: 'Poll try-on job status/result', auth: true },
  { method: 'GET', path: '/api/v1/admin/companies', description: 'List all companies (super admin)', auth: true, roles: ['SUPER_ADMIN'] },
  { method: 'POST', path: '/api/v1/admin/companies', description: 'Create company account', auth: true, roles: ['SUPER_ADMIN'] },
];

export const WS_EVENTS: WSEvent[] = [
  { name: 'SESSION_CONNECTED', direction: 'LISTEN', description: 'Mobile app connected to session', payload: '{ sessionId, mirrorId }' },
  { name: 'PRODUCT_SELECTED', direction: 'BOTH', description: 'Mobile selects product — mirror renders overlay', payload: '{ sessionId, productId }' },
  { name: 'COLOR_CHANGED', direction: 'BOTH', description: 'Color variant changed', payload: '{ sessionId, colorId, colorHex }' },
  { name: 'SIZE_CHANGED', direction: 'BOTH', description: 'Size variant changed', payload: '{ sessionId, size }' },
  { name: 'TRYON_STARTED', direction: 'EMIT', description: 'AI try-on rendering started on mirror', payload: '{ sessionId, jobId }' },
  { name: 'TRYON_COMPLETED', direction: 'EMIT', description: 'AI overlay ready for display', payload: '{ sessionId, jobId, overlayUrl }' },
  { name: 'FAVORITE_ADDED', direction: 'LISTEN', description: 'Product added to favorites', payload: '{ sessionId, productId }' },
  { name: 'SESSION_ENDED', direction: 'BOTH', description: 'Session terminated by either party', payload: '{ sessionId, reason }' },
];
