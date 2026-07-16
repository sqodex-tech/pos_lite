'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Building2, CreditCard, Activity, ArrowUpRight, ShieldAlert, Zap, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { useDashboard } from '@/hooks/admin/useDashboard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function Dashboard() {
  const router = useRouter();
  const { data, loading, error, fetchDashboard } = useDashboard();
  const [user, setUser] = useState<User | null>(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    const token = localStorage.getItem('sumbox_admin_token');
    if (!token) {
      router.push('/admin/login');
    } else {
      setUser(JSON.parse(localStorage.getItem('sumbox_admin_user') || '{}'));
    }
  }, [router]);

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
    fetchDashboard(newPeriod);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse text-sm uppercase tracking-widest">Synchronizing platform data...</p>
      </div>
    );
  }

  if (error) {
     return (
       <motion.div 
         initial={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         className="p-12 text-center text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/20"
       >
         <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-rose-400" />
         <h3 className="text-xl font-bold text-rose-800 dark:text-rose-400">System Link Error</h3>
         <p className="mt-2 text-rose-600 dark:text-rose-500 text-sm">{error}</p>
         <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all text-xs uppercase tracking-widest">Connect to Node</button>
       </motion.div>
     );
  }

  const overview = data?.overview || { totalTenants: 0, activeSubscriptions: 0, totalRevenue: 0, totalUsers: 0 };
  const revenueData = data?.revenue?.revenueByDay || [];
  const planDistribution = data?.planDistribution || [];
  const recentActivities = data?.recentActivities || { newSubscriptions: [], billing: [] };
  
  const stats = [
    { name: 'Total Entities', value: overview.totalTenants.toLocaleString(), change: '+12.5%', icon: Building2, color: 'indigo' },
    { name: 'Active Subs', value: overview.activeSubscriptions.toLocaleString(), change: '+8.2%', icon: Zap, color: 'emerald' },
    { name: 'Gross Revenue', value: `Rs ${overview.totalRevenue.toLocaleString()}`, change: '+15.4%', icon: TrendingUp, color: 'violet' },
    { name: 'Platform Users', value: overview.totalUsers.toLocaleString(), change: '+2.1%', icon: Users, color: 'amber' },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div variants={item}>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Welcome back, {user?.name || 'Super Admin'}</p>
        </motion.div>
        
        <motion.div variants={item} className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
            System Online
          </div>
          <select 
            value={period}
            onChange={handlePeriodChange}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold p-2 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.name} 
              variants={item}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold">{stat.name}</h3>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Revenue Overview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform gross revenue over time</p>
            </div>
          </div>
          <div className="h-80 relative flex flex-col justify-center">
            {revenueData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Activity className="w-12 h-12 mb-2 text-slate-200 dark:text-slate-700" />
                    <p className="text-sm font-bold">No revenue data yet</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" strokeOpacity={0.1} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} 
                      dy={10} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#64748B', fontWeight: 800 }} 
                      tickFormatter={(value) => `Rs ${value}`} 
                      dx={-10} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '20px', color: '#F8FAFC', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', borderTop: '4px solid #6366F1' }}
                      itemStyle={{ color: '#818CF8', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Gross Revenue" 
                      stroke="#6366F1" 
                      strokeWidth={5} 
                      dot={revenueData.length === 1 ? { r: 6, fill: '#6366F1' } : { r: 0 }} 
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#6366F1' }} 
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2">Market Share</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-10">Subscription Tier Distribution</p>
          <div className="h-64 relative flex flex-col justify-center">
            {planDistribution.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <PieChart className="w-12 h-12 mb-2 text-slate-200 dark:text-slate-700" />
                    <p className="text-sm font-bold">No subscriptions yet</p>
                </div>
            ) : (
                <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="subscribers"
                      nameKey="plan"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '16px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{overview.activeSubscriptions}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Active</span>
                </div>
                </>
            )}
          </div>
          <div className="mt-8 space-y-3">
             {planDistribution.map((plan, index) => (
               <div key={plan.plan} className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{plan.plan}</span>
                 </div>
                 <span className="text-sm font-bold text-slate-900 dark:text-white">{plan.percentage}%</span>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-100 dark:bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/30 transition-all duration-700"></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Platform Uptime</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Global Server Status</p>
            </div>
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center relative z-10">
              <span className="text-sm font-medium text-slate-500">Uptime</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">99.99%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 relative z-10">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="flex justify-between items-center relative z-10">
              <span className="text-sm font-medium text-slate-500">Active Instances</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">4 / 4</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-violet-100 dark:bg-violet-500/20 rounded-full blur-3xl group-hover:bg-violet-200 dark:group-hover:bg-violet-500/30 transition-all duration-700"></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Database Health</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Cluster Performance</p>
            </div>
            <div className="p-2.5 bg-violet-500/20 text-violet-400 rounded-xl border border-violet-500/30">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Latency</span>
              <span className="text-sm font-black text-emerald-400">24ms</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: '24%' }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Queries/sec</span>
              <span className="text-sm font-black">1,204</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-100 dark:bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-200 dark:group-hover:bg-amber-500/30 transition-all duration-700"></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">API Gateway</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Request Routing</p>
            </div>
            <div className="p-2.5 bg-amber-500/20 text-amber-500 dark:text-amber-400 rounded-xl border border-amber-500/30 relative z-10">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center relative z-10">
              <span className="text-sm font-medium text-slate-500">Success Rate</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">99.8%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 relative z-10">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '99%' }}></div>
            </div>
            <div className="flex justify-between items-center relative z-10">
              <span className="text-sm font-medium text-slate-500">Error Rate</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">0.2%</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Recent Onboarding</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Latest subscription entities</p>
             </div>
             <button className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                <ArrowRight className="w-5 h-5" />
             </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {recentActivities.newSubscriptions.length > 0 ? (
              recentActivities.newSubscriptions.map((sub: any) => (
                <div key={sub.id || sub._id || Math.random()} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-indigo-900/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 dark:border-slate-700">
                      {(sub.tenantId?.name || 'T')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{sub.tenantId?.name || 'New Tenant'}</p>
                      <p className="text-xs font-semibold text-indigo-500">{sub.planId?.name || 'Standard Plan'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Rs {sub.priceSnapshot?.amount || 0}</p>
                    <p className="text-xs font-medium text-slate-400 flex items-center gap-1 justify-end mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No recent onboardings</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Recent Revenue</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Live financial transactions</p>
             </div>
             <button className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                <TrendingUp className="w-5 h-5" />
             </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {recentActivities.billing.length > 0 ? (
              recentActivities.billing.map((bill: any) => (
                <div key={bill.id || bill._id || Math.random()} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-indigo-900/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-600 font-bold border border-emerald-100 dark:border-slate-700">
                      Rs 
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Payment Received</p>
                      <p className="text-xs font-semibold text-emerald-500">{bill.tenantId?.name || 'Tenant'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Rs {bill.amount.toLocaleString()}</p>
                    <div className="inline-flex items-center px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-md border border-emerald-100 dark:border-emerald-900/30 mt-1">
                      Paid
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No recent transactions</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
