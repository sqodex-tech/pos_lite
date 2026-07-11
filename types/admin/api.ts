import { Plan, Tenant, Subscription, User, BillingHistory, DashboardStats } from './index';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  status: number;
  meta?: {
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface BillingDashboard {
  stats: {
    totalRevenue: number;
    mrr: number;
    activeSubscriptions: number;
    successfulCollections: number;
    totalTenants?: number;
    totalUsers?: number;
  };
  recentHistory: BillingHistory[];
  paymentTrends: {
    date: string;
    amount: number;
    count: number;
  }[];
}

export interface SubscriptionStats {
  totalActive: number;
  totalCancelled: number;
  totalExpired: number;
  expiringSoon: number;
  trialSubscriptions: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  active?: number;
  pending?: number;
  totalMonthlyRevenue?: number;
}

export interface PlanDistribution {
  plan: string;
  subscribers: number;
  revenue: number;
  percentage: number;
}

export interface AnalyticsDashboard {
  overview: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    expiringSoon: number;
    totalRevenue: number;
  };
  revenue: {
    mrr: number;
    totalRevenue: number;
    revenueGrowth: number;
    revenueByDay: {
      date: string;
      revenue: number;
      count: number;
    }[];
  };
  performance: {
    churnRate: number;
    trialConversionRate: number;
  };
  planDistribution: PlanDistribution[];
  recentActivities: {
    newSubscriptions: Subscription[];
    billing: BillingHistory[];
  };
}
