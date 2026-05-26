export interface AdminStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalProducts: number;
  productsChange: number;
  totalVendors: number;
  vendorsChange: number;
  totalAffiliates: number;
  affiliatesChange: number;
  pendingProducts: number;
  pendingVendors: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: "placed" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
}

export interface PendingItem {
  id: string;
  type: "product" | "vendor";
  title: string;
  submittedBy: string;
  date: string;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  orders: number;
}

export const mockAdminStats: AdminStats = {
  totalRevenue: 285_450,
  revenueChange: 12.5,
  totalOrders: 1_247,
  ordersChange: 8.3,
  totalProducts: 3_892,
  productsChange: -2.1,
  totalVendors: 48,
  vendorsChange: 16.7,
  totalAffiliates: 124,
  affiliatesChange: 22.4,
};

export const mockRecentOrders: RecentOrder[] = [
  { id: "ORD-001", customer: "Aminata S.", items: 3, total: 8_500, status: "delivered", date: "2026-05-20" },
  { id: "ORD-002", customer: "Musa K.", items: 1, total: 2_200, status: "shipped", date: "2026-05-19" },
  { id: "ORD-003", customer: "Fatima J.", items: 2, total: 5_750, status: "processing", date: "2026-05-19" },
  { id: "ORD-004", customer: "Buba T.", items: 5, total: 12_300, status: "placed", date: "2026-05-18" },
  { id: "ORD-005", customer: "Kaddy N.", items: 1, total: 1_800, status: "delivered", date: "2026-05-18" },
  { id: "ORD-006", customer: "Lamin C.", items: 2, total: 4_100, status: "placed", date: "2026-05-17" },
  { id: "ORD-007", customer: "Isatou B.", items: 4, total: 9_900, status: "processing", date: "2026-05-17" },
  { id: "ORD-008", customer: "Sainey D.", items: 1, total: 3_200, status: "cancelled", date: "2026-05-16" },
];

export const mockPendingItems: PendingItem[] = [
  { id: "P001", type: "product", title: "Handmade Leather Sandals", submittedBy: "CraftHouse Banjul", date: "2 hours ago" },
  { id: "P002", type: "product", title: "Organic Shea Butter Set", submittedBy: "Serekunda Naturals", date: "5 hours ago" },
  { id: "P003", type: "vendor", title: "Jarta Tech Solutions", submittedBy: "Ousman J.", date: "1 day ago" },
  { id: "P004", type: "product", title: "Traditional Kora Instrument", submittedBy: "Brikama Crafts", date: "1 day ago" },
  { id: "P005", type: "vendor", title: "Banjul Fashion House", submittedBy: "Mariama C.", date: "2 days ago" },
];

export const mockRevenueByMonth: RevenueByMonth[] = [
  { month: "Jan", revenue: 18_200, orders: 85 },
  { month: "Feb", revenue: 21_500, orders: 102 },
  { month: "Mar", revenue: 24_800, orders: 118 },
  { month: "Apr", revenue: 22_100, orders: 95 },
  { month: "May", revenue: 28_450, orders: 134 },
  { month: "Jun", revenue: 32_100, orders: 156 },
];

export const statusColors: Record<string, string> = {
  placed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  processing: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  shipped: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  delivered: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

// ─── Admin User Management ─────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "superadmin" | "admin" | "vendor" | "affiliate" | "customer";
  status: "active" | "pending" | "rejected" | "suspended";
  date_of_birth: string | null;
  age_verified: boolean;
  commission_payout_preference: "mobile_money" | "credits";
  invited_by: string | null;
  created_at: string;
  total_orders?: number;
  total_spent?: number;
  business_name?: string;
}

export const mockUsers: AdminUser[] = [
  {
    id: "USR-001",
    full_name: "Alieu Jallow",
    email: "alieu@temsmarket.gm",
    phone: "+220 999 0001",
    role: "superadmin",
    status: "active",
    date_of_birth: "1985-03-14",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: null,
    created_at: "2025-01-15",
    total_orders: 0,
    total_spent: 0,
  },
  {
    id: "USR-002",
    full_name: "Mariama Bah",
    email: "mariama@temsmarket.gm",
    phone: "+220 999 0002",
    role: "admin",
    status: "active",
    date_of_birth: "1990-07-22",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: "USR-001",
    created_at: "2025-02-01",
    total_orders: 0,
    total_spent: 0,
  },
  {
    id: "USR-003",
    full_name: "Ousman Sowe",
    email: "ousman@temsmarket.gm",
    phone: "+220 999 0003",
    role: "admin",
    status: "active",
    date_of_birth: "1988-11-05",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: "USR-001",
    created_at: "2025-02-15",
    total_orders: 0,
    total_spent: 0,
  },
  {
    id: "USR-004",
    full_name: "Aminata Sanyang",
    email: "aminata.s@craftbanjul.gm",
    phone: "+220 770 1001",
    role: "vendor",
    status: "active",
    date_of_birth: "1992-04-18",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: null,
    created_at: "2025-03-01",
    total_orders: 156,
    total_spent: 0,
    business_name: "CraftHouse Banjul",
  },
  {
    id: "USR-005",
    full_name: "Buba Touray",
    email: "buba@serenaturals.gm",
    phone: "+220 770 1002",
    role: "vendor",
    status: "active",
    date_of_birth: "1986-09-30",
    age_verified: true,
    commission_payout_preference: "credits",
    invited_by: null,
    created_at: "2025-03-10",
    total_orders: 89,
    total_spent: 0,
    business_name: "Serekunda Naturals",
  },
  {
    id: "USR-006",
    full_name: "Fatoumata Jallow",
    email: "fatoumata@brightech.gm",
    phone: "+220 770 1003",
    role: "vendor",
    status: "pending",
    date_of_birth: "1994-12-08",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: null,
    created_at: "2026-05-20",
    total_orders: 0,
    total_spent: 0,
    business_name: "Brightech Solutions",
  },
  {
    id: "USR-007",
    full_name: "Musa Kanteh",
    email: "musa.kanteh@gmail.com",
    phone: "+220 780 2001",
    role: "affiliate",
    status: "active",
    date_of_birth: "1995-06-15",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: "USR-001",
    created_at: "2025-04-01",
    total_orders: 0,
    total_spent: 0,
  },
  {
    id: "USR-008",
    full_name: "Isatou Bojang",
    email: "isatou.b@yahoo.com",
    phone: "+220 780 2002",
    role: "affiliate",
    status: "active",
    date_of_birth: "1997-08-22",
    age_verified: true,
    commission_payout_preference: "credits",
    invited_by: null,
    created_at: "2025-04-15",
    total_orders: 0,
    total_spent: 0,
  },
  {
    id: "USR-009",
    full_name: "Lamin Camara",
    email: "lamin.cam@gmail.com",
    phone: "+220 780 2003",
    role: "affiliate",
    status: "suspended",
    date_of_birth: "1993-02-10",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: "USR-002",
    created_at: "2025-05-01",
    total_orders: 0,
    total_spent: 0,
  },
  {
    id: "USR-010",
    full_name: "Kaddy Njie",
    email: "kaddy.njie@gmail.com",
    phone: "+220 790 3001",
    role: "customer",
    status: "active",
    date_of_birth: "1999-01-25",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: null,
    created_at: "2025-06-01",
    total_orders: 12,
    total_spent: 45_800,
  },
  {
    id: "USR-011",
    full_name: "Sainey Darboe",
    email: "sainey.d@outlook.com",
    phone: "+220 790 3002",
    role: "customer",
    status: "active",
    date_of_birth: "2001-11-18",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: "USR-010",
    created_at: "2025-06-20",
    total_orders: 5,
    total_spent: 12_200,
  },
  {
    id: "USR-012",
    full_name: "Aisha Ceesay",
    email: "aisha.c@gmail.com",
    phone: "+220 790 3003",
    role: "customer",
    status: "suspended",
    date_of_birth: "2000-05-30",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: null,
    created_at: "2025-07-10",
    total_orders: 1,
    total_spent: 3_500,
  },
  {
    id: "USR-013",
    full_name: "Amadou Bah",
    email: "amadou.bah@craftbanjul.gm",
    phone: "+220 770 1004",
    role: "vendor",
    status: "rejected",
    date_of_birth: "1989-07-14",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: null,
    created_at: "2026-05-18",
    total_orders: 0,
    total_spent: 0,
    business_name: "Banjul Artisans Guild",
  },
  {
    id: "USR-014",
    full_name: "Hawa Manneh",
    email: "hawa.m@gmail.com",
    phone: "+220 780 2004",
    role: "affiliate",
    status: "pending",
    date_of_birth: "1996-03-05",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: "USR-001",
    created_at: "2026-05-22",
    total_orders: 0,
    total_spent: 0,
  },
  {
    id: "USR-015",
    full_name: "Kebba Fofana",
    email: "kebba.f@gmail.com",
    phone: "+220 790 3004",
    role: "customer",
    status: "pending",
    date_of_birth: "2002-09-12",
    age_verified: true,
    commission_payout_preference: "mobile_money",
    invited_by: null,
    created_at: "2026-05-23",
    total_orders: 0,
    total_spent: 0,
  },
  {
    id: "USR-016",
    full_name: "Ndey Jobarteh",
    email: "ndey.jobarteh@gmail.com",
    phone: "+220 790 3005",
    role: "customer",
    status: "active",
    date_of_birth: "1998-12-20",
    age_verified: true,
    commission_payout_preference: "credits",
    invited_by: null,
    created_at: "2025-08-05",
    total_orders: 8,
    total_spent: 23_400,
  },
];
