# Inventory UI Components

Modern, reusable components for inventory management with advanced features.

## Components

### 1. SearchableSelect

A powerful dropdown component with search, keyboard navigation, and visual feedback.

#### Features
- 🔍 Real-time search filtering
- ⌨️ Full keyboard navigation
- 🎨 Icons and color support
- 📝 Description support
- ❌ Clear selection option
- ♿ Accessibility compliant

#### Usage

```tsx
import { SearchableSelect } from '@/components/inventory';

<SearchableSelect
  label="Category"
  options={[
    {
      value: '1',
      label: 'Beverages',
      icon: '🥤',
      color: '#3B82F6',
      description: 'Drinks and beverages'
    },
    {
      value: '2',
      label: 'Food',
      icon: '🍔',
      color: '#10B981',
      description: 'Food items'
    }
  ]}
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  placeholder="Select a category"
  allowClear
  required
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| options | `Option[]` | required | Array of options |
| value | `string` | required | Selected value |
| onChange | `(value: string) => void` | required | Change handler |
| placeholder | `string` | 'Select an option' | Placeholder text |
| label | `string` | - | Field label |
| error | `string` | - | Error message |
| required | `boolean` | false | Required field |
| disabled | `boolean` | false | Disabled state |
| allowClear | `boolean` | true | Show clear button |

#### Option Interface

```typescript
interface Option {
  value: string;
  label: string;
  icon?: string;        // Emoji or icon
  color?: string;       // Hex color
  description?: string; // Additional info
}
```

#### Keyboard Shortcuts

- `↓` / `↑` - Navigate options
- `Enter` - Select highlighted option
- `Escape` - Close dropdown
- `Space` - Open dropdown (when focused)
- `Tab` - Move to next field

---

### 2. AdvancedFilters

Comprehensive filtering panel with multiple criteria.

#### Features
- 🎯 Multiple filter types
- 🔢 Active filter count badge
- 🔄 Quick reset
- 💾 Filter state management
- 📱 Responsive design

#### Usage

```tsx
import { AdvancedFilters, FilterState } from '@/components/inventory';

const [filters, setFilters] = useState<FilterState>({
  status: 'all',
  categoryId: '',
  unitId: '',
  priceRange: { min: '', max: '' },
  stockAlert: false
});

<AdvancedFilters
  filters={filters}
  onFiltersChange={setFilters}
  categories={categories}
  units={units}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| filters | `FilterState` | Current filter state |
| onFiltersChange | `(filters: FilterState) => void` | Filter change handler |
| categories | `Category[]` | Available categories |
| units | `Unit[]` | Available units |

#### FilterState Interface

```typescript
interface FilterState {
  status: string;                    // 'all' | 'active' | 'inactive'
  categoryId: string;                // Category ID or empty
  unitId: string;                    // Unit ID or empty
  priceRange: { min: string; max: string }; // Price range
  stockAlert: boolean;               // Low stock filter
}
```

---

### 3. BulkActions

Floating toolbar for bulk operations on selected items.

#### Features
- ✅ Selection count display
- 📤 Bulk export
- 🔄 Bulk status change
- 🗑️ Bulk delete
- 🎭 Smooth animations
- 📍 Fixed positioning

#### Usage

```tsx
import { BulkActions } from '@/components/inventory';

<BulkActions
  selectedIds={selectedIds}
  onClearSelection={() => setSelectedIds([])}
  onDelete={handleBulkDelete}
  onExport={handleExport}
  onStatusChange={handleBulkStatusChange}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| selectedIds | `string[]` | Array of selected item IDs |
| onClearSelection | `() => void` | Clear selection handler |
| onDelete | `(ids: string[]) => Promise<void>` | Bulk delete handler |
| onExport | `(ids: string[]) => void` | Export handler |
| onStatusChange | `(ids: string[], status: 'active' \| 'inactive') => Promise<void>` | Status change handler |

#### Example Handlers

```typescript
const handleBulkDelete = async (ids: string[]) => {
  await Promise.all(ids.map(id => inventoryApi.delete(id)));
  fetchItems();
};

const handleBulkStatusChange = async (ids: string[], status: 'active' | 'inactive') => {
  await Promise.all(ids.map(id => inventoryApi.update(id, { status })));
  fetchItems();
};

const handleExport = (ids: string[]) => {
  const data = items.filter(item => ids.includes(item._id));
  exportToCSV(data, columns, 'inventory-export.csv');
};
```

---

### 4. ItemFormModal

Comprehensive form modal for creating/editing inventory items.

#### Features
- 📝 Multi-section form layout
- ✅ Real-time validation
- 💰 Profit margin calculation
- 🔍 Searchable category/unit selects
- 🎨 Modern design
- ♿ Accessible

#### Usage

```tsx
import { ItemFormModal } from '@/components/inventory';

<ItemFormModal
  item={selectedItem}
  categories={categories}
  units={units}
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    fetchItems();
    setShowModal(false);
  }}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| item | `Item \| null` | Item to edit (null for create) |
| categories | `Category[]` | Available categories |
| units | `Unit[]` | Available units |
| onClose | `() => void` | Close handler |
| onSuccess | `() => void` | Success handler |

#### Form Sections

1. **Basic Information**
   - Product Name (required)
   - Barcode (required)

2. **Classification**
   - Category (searchable select)
   - Unit (searchable select)

3. **Pricing**
   - Purchase Price (required)
   - Sale Price (required)
   - Profit Margin (calculated)

4. **Inventory Settings**
   - Low Stock Alert (required)
   - Status (active/inactive)

#### Validation Rules

- Name: Required, min 1 character
- Barcode: Required
- Purchase Price: Required, >= 0
- Sale Price: Required, >= 0, > purchase price
- Low Stock Alert: Required, >= 0

---

## Styling

All components use Tailwind CSS with consistent design tokens:

### Colors

```css
Primary: #6366F1 (Indigo)
Secondary: #3B82F6 (Blue)
Success: #10B981 (Emerald)
Warning: #F59E0B (Amber)
Danger: #EF4444 (Rose)
```

### Border Radius

```css
Cards: rounded-3xl (24px)
Inputs: rounded-2xl (16px)
Buttons: rounded-2xl (16px)
Small: rounded-lg (8px)
```

### Spacing

```css
Component padding: p-6 (24px)
Section gap: space-y-6 (24px)
Element gap: gap-4 (16px)
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ ARIA labels
- ✅ Color contrast
- ✅ Screen reader support
- ✅ Error announcements

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

```json
{
  "react": "^18.x",
  "framer-motion": "^10.x",
  "lucide-react": "^0.x",
  "tailwindcss": "^3.x"
}
```

## Examples

### Complete Inventory Page

```tsx
import { useState, useEffect } from 'react';
import {
  ItemFormModal,
  SearchableSelect,
  AdvancedFilters,
  BulkActions
} from '@/components/inventory';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    categoryId: '',
    unitId: '',
    priceRange: { min: '', max: '' },
    stockAlert: false
  });

  // ... implementation
}
```

### Custom SearchableSelect

```tsx
// With custom styling
<SearchableSelect
  options={options}
  value={value}
  onChange={onChange}
  className="custom-class"
  placeholder="Custom placeholder"
/>
```

## Best Practices

1. **Always provide labels** for form fields
2. **Handle loading states** in parent components
3. **Validate data** before passing to components
4. **Use TypeScript** for type safety
5. **Test keyboard navigation** thoroughly
6. **Provide error messages** for failed operations
7. **Debounce search inputs** for performance
8. **Memoize expensive calculations**

## Performance Tips

- Use `React.memo` for list items
- Implement virtual scrolling for large lists
- Debounce search inputs (300ms recommended)
- Lazy load modals
- Optimize re-renders with proper key props

## Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchableSelect } from '@/components/inventory';

test('opens dropdown on click', () => {
  render(
    <SearchableSelect
      options={mockOptions}
      value=""
      onChange={jest.fn()}
    />
  );
  
  const button = screen.getByRole('button');
  fireEvent.click(button);
  
  expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
});
```

## Contributing

When adding new components:

1. Follow existing patterns
2. Add TypeScript interfaces
3. Include accessibility features
4. Write documentation
5. Add examples
6. Test thoroughly

## License

Part of SumboxPro Inventory Management System
