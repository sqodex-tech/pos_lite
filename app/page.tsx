'use client';

import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MoreVertical } from 'lucide-react';
import Image from 'next/image';

const revenueData = [
  { name: 'Apr 30', supplier: 4000, customer: 2400 },
  { name: 'May 5', supplier: 3000, customer: 1398 },
  { name: 'May 10', supplier: 2000, customer: 9800 },
  { name: 'May 15', supplier: 2780, customer: 3908 },
  { name: 'May 20', supplier: 1890, customer: 4800 },
  { name: 'May 25', supplier: 2390, customer: 3800 },
  { name: 'May 30', supplier: 3490, customer: 4300 },
];

const pieData = [
  { name: 'Suppliers Send', value: 1000, color: '#fca5a5' }, // light red/orange
  { name: 'Customer Recieve', value: 7250, color: '#3b82f6' }, // blue
];

const recentCustomers = [
  { id: 1, name: 'Jane Cooper', amount: '$1000', date: '10/Jan/2023', status: 'Completed', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Jenny Wilson', amount: '$1000', date: '10/Jan/2023', status: 'Progress', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'Darrell Steward', amount: '$1000', date: '10/Jan/2023', status: 'Completed', avatar: 'https://i.pravatar.cc/150?u=3' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Revenue Overview Chart */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-pos-text">Revenue Overview</h2>
            <p className="text-sm text-gray-400">Apr 30 - May 30</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSupplier" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCustomer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fca5a5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fca5a5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide={true} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="supplier" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSupplier)" strokeWidth={3} />
                <Area type="monotone" dataKey="customer" stroke="#fca5a5" fillOpacity={1} fill="url(#colorCustomer)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm font-medium">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pos-blue"></div>
              <span className="text-gray-500">Supplier</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#fca5a5]"></div>
              <span className="text-gray-500">Customer</span>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm flex flex-col justify-center relative">
           <div className="absolute top-6 left-6 text-gray-400 cursor-pointer hover:text-gray-600">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
           </div>
           <div className="absolute top-6 right-6 text-gray-400 cursor-pointer hover:text-gray-600">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
           </div>
          
          <div className="flex items-center justify-between">
            <div className="h-64 w-64 relative -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-[20%] right-[0px] bg-white px-3 py-1 rounded-full shadow-md text-sm font-bold">20%</div>
              <div className="absolute bottom-[20%] left-[20px] bg-white px-3 py-1 rounded-full shadow-md text-sm font-bold">65%</div>
            </div>
            
            <div className="flex-1 pl-4 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#fca5a5]"></div>
                  <span className="text-gray-500 text-sm font-medium">Suppliers Send</span>
                </div>
                <span className="font-bold text-pos-text">$1,000</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-pos-blue"></div>
                  <span className="text-gray-500 text-sm font-medium">Customer Recieve</span>
                </div>
                <span className="font-bold text-pos-text">$7,250</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Customers List */}
      <div>
        <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] px-6 mb-4 text-gray-500 font-medium">
          <div className="text-xl text-pos-text">Customers</div>
          <div>Amount</div>
          <div>Date</div>
          <div>Payment Status</div>
        </div>

        <div className="space-y-3">
          {recentCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-[24px] p-4 grid grid-cols-[2fr_1fr_1fr_1.5fr] items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <img src={customer.avatar} alt={customer.name} className="w-12 h-12 rounded-2xl object-cover" />
                <span className="font-medium text-pos-text">{customer.name}</span>
              </div>
              <div className="font-medium text-pos-text">{customer.amount}</div>
              <div className="font-medium text-pos-text">{customer.date}</div>
              <div className="flex items-center justify-between pr-4">
                <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  customer.status === 'Completed' 
                    ? 'bg-[#e5edf5] text-pos-sidebar' 
                    : 'bg-[#fed7aa] text-[#9a3412]'
                }`}>
                  {customer.status}
                </span>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
