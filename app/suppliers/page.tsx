import { MoreVertical } from 'lucide-react';

const suppliers = [
  { id: 1, name: 'Robert Fox', amount: '$2400', date: '11/Jan/2023', status: 'Completed', avatar: 'https://i.pravatar.cc/150?u=11' },
  { id: 2, name: 'Cody Fisher', amount: '$1500', date: '12/Jan/2023', status: 'Progress', avatar: 'https://i.pravatar.cc/150?u=12' },
  { id: 3, name: 'Bessie Cooper', amount: '$3200', date: '13/Jan/2023', status: 'Completed', avatar: 'https://i.pravatar.cc/150?u=13' },
  { id: 4, name: 'Ralph Edwards', amount: '$4100', date: '14/Jan/2023', status: 'Completed', avatar: 'https://i.pravatar.cc/150?u=14' },
];

export default function SuppliersPage() {
  return (
    <div>
      <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] px-6 mb-4 text-gray-500 font-medium">
        <div className="text-xl text-pos-text">Suppliers</div>
        <div>Amount</div>
        <div>Date</div>
        <div>Payment Status</div>
      </div>

      <div className="space-y-3">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-[24px] p-4 grid grid-cols-[2fr_1fr_1fr_1.5fr] items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <img src={supplier.avatar} alt={supplier.name} className="w-12 h-12 rounded-2xl object-cover" />
              <span className="font-medium text-pos-text">{supplier.name}</span>
            </div>
            <div className="font-medium text-pos-text">{supplier.amount}</div>
            <div className="font-medium text-pos-text">{supplier.date}</div>
            <div className="flex items-center justify-between pr-4">
              <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                supplier.status === 'Completed' 
                  ? 'bg-[#e5edf5] text-pos-sidebar' 
                  : 'bg-[#fed7aa] text-[#9a3412]'
              }`}>
                {supplier.status}
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
