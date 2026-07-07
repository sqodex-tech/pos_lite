import { MoreVertical } from 'lucide-react';

const customers = [
  { id: 1, name: 'Jane Cooper', amount: '$1000', date: '10/Jan/2023', status: 'Completed', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Jenny Wilson', amount: '$1000', date: '10/Jan/2023', status: 'Progress', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'Darrell Steward', amount: '$1000', date: '10/Jan/2023', status: 'Completed', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: 'Esther Howard', amount: '$1000', date: '10/Jan/2023', status: 'Completed', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: 5, name: 'Eleanor Pena', amount: '$1000', date: '10/Jan/2023', status: 'Progress', avatar: 'https://i.pravatar.cc/150?u=5' },
];

export default function CustomersPage() {
  return (
    <div>
      <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] px-6 mb-4 text-gray-500 font-medium">
        <div className="text-xl text-pos-text">Customers</div>
        <div>Amount</div>
        <div>Date</div>
        <div>Payment Status</div>
      </div>

      <div className="space-y-3">
        {customers.map((customer) => (
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
  );
}
