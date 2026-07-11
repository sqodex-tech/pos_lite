export interface Plan {
  _id: string;
  id?: string;
  name: string;
  price: number;
  isTrialPlan: boolean;
  maxUsers: number;
  maxItems: number;
  maxBranches: number;
  features: string[];
  durationInDays: number;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'inactive';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tenant {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'active' | 'suspended' | 'inactive';
  subscriptionPlan?: Plan | string;
  subscriptionStart?: string;
  nextBillingDate?: string;
  hasUsedTrial: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscription {
  _id: string;
  id?: string;
  tenantId: Tenant;
  planId: Plan;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  isTrial: boolean;
  trialEndsAt?: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  priceSnapshot: {
    amount: number;
    currency: string;
    durationInDays: number;
  };
  limitsSnapshot: {
    maxUsers: number;
    maxItems: number;
    maxBranches: number;
  };
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'ADMIN' | 'STORE_MANAGER' | 'SALES' | 'ACCOUNTANT';
  tenantId?: string | Tenant;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export interface BillingHistory {
  _id: string;
  tenantId: Tenant;
  subscriptionId?: Subscription;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  billingDate: string;
  description: string;
  invoiceUrl?: string;
  paymentDetails?: any;
}

export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  mrr: number;
  activeSubscriptions: number;
}
