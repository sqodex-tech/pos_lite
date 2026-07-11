const inventoryService = require('../../src/services/inventory.service');
const Item = require('../../src/models/Item');

jest.mock('../../src/models/Item');

describe('InventoryService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createItem', () => {
        it('should create an item with tenantId', async () => {
            const itemData = { name: 'Test Item', purchasePrice: 10, salePrice: 20 };
            const tenantId = 'tenant123';

            Item.create.mockResolvedValue({ ...itemData, tenantId });

            const result = await inventoryService.createItem(itemData, tenantId);

            expect(Item.create).toHaveBeenCalledWith({ ...itemData, tenantId });
            expect(result.name).toBe('Test Item');
        });
    });
});
