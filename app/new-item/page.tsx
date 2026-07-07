'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Smartphone } from 'lucide-react';

const items = [
  { id: 'iphone10', name: 'Iphone 10', models: ['10', '10 Pro', '10 Pro Max'] },
  { id: 'iphone11', name: 'Iphone 11', models: ['11', '11 Pro', '11 Pro Max'] },
  { id: 'iphone12', name: 'Iphone 12', models: ['12 Mini', '12', '12 Pro', '12 Pro Max'] },
  { id: 'iphone13', name: 'Iphone 13', models: ['13 Mini', '13', '13 Pro', '13 Pro Max'] },
];

export default function NewItemPage() {
  const [openItems, setOpenItems] = useState<string[]>(['iphone10']);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className="bg-[#dce9f3] rounded-2xl p-4 mb-4 flex items-center justify-between cursor-pointer shadow-sm">
        <div className="flex items-center gap-3 text-pos-sidebar font-medium">
          <div className="p-1 bg-white rounded-md shadow-sm">
            <Smartphone size={16} className="text-green-500" />
          </div>
          Add Item
        </div>
        <ChevronDown size={20} className="text-pos-sidebar" />
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const isOpen = openItems.includes(item.id);
          
          return (
            <div key={item.id} className="bg-[#dce9f3] rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => toggleItem(item.id)}
              >
                <div className="flex items-center gap-3 text-pos-sidebar font-medium">
                  <div className="p-1 bg-white rounded-md shadow-sm">
                    <Smartphone size={16} className="text-green-500" />
                  </div>
                  {item.name}
                </div>
                {isOpen ? <ChevronUp size={20} className="text-pos-sidebar" /> : <ChevronDown size={20} className="text-pos-sidebar" />}
              </div>
              
              {isOpen && (
                <div className="px-14 pb-4 space-y-3">
                  {item.models.map((model) => (
                    <div key={model} className="flex items-center gap-3 text-gray-500 hover:text-pos-sidebar cursor-pointer transition-colors">
                      <div className="p-1 bg-white rounded-md shadow-sm">
                         <Smartphone size={16} className="text-green-500" />
                      </div>
                      Iphone {model}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
