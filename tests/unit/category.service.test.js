const mongoose = require('mongoose');
const categoryService = require('../../src/services/category.service');
const Category = require('../../src/models/Category');
const Item = require('../../src/models/Item');
const ApiError = require('../../src/utils/ApiError');

// Mock dependencies
jest.mock('../../src/models/Category');
jest.mock('../../src/models/Item');
jest.mock('../../src/utils/logger');

describe('CategoryService', () => {
    const tenantId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createCategory', () => {
        it('should create a category successfully', async () => {
            const categoryData = {
                name: 'Beverages',
                description: 'Hot and cold drinks',
                status: 'active'
            };

            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Category.findOne = jest.fn().mockResolvedValue(null);
            Category.prototype.save = jest.fn().mockResolvedValue({
                _id: categoryId,
                ...categoryData,
                tenantId,
                createdBy: userId
            });

            const result = await categoryService.createCategory(tenantId, categoryData, userId);

            expect(result).toBeDefined();
            expect(Category.findOne).toHaveBeenCalledWith({
                tenantId,
                name: categoryData.name,
                deletedAt: null
            });
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });

        it('should throw error if category name already exists', async () => {
            const categoryData = { name: 'Beverages' };

            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Category.findOne = jest.fn().mockResolvedValue({ name: 'Beverages' });

            await expect(
                categoryService.createCategory(tenantId, categoryData, userId)
            ).rejects.toThrow(ApiError);

            expect(mockSession.abortTransaction).toHaveBeenCalled();
        });

        it('should validate parent category exists', async () => {
            const parentId = new mongoose.Types.ObjectId();
            const categoryData = {
                name: 'Coffee',
                parentId: parentId.toString()
            };

            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Category.findOne = jest.fn()
                .mockResolvedValueOnce(null) // Name check
                .mockResolvedValueOnce(null); // Parent check

            await expect(
                categoryService.createCategory(tenantId, categoryData, userId)
            ).rejects.toThrow('Parent category not found');
        });
    });

    describe('getCategories', () => {
        it('should return paginated categories', async () => {
            const mockCategories = [
                { _id: categoryId, name: 'Beverages', tenantId },
                { _id: new mongoose.Types.ObjectId(), name: 'Food', tenantId }
            ];

            Category.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockCategories)
            });

            Category.countDocuments = jest.fn().mockResolvedValue(2);

            const result = await categoryService.getCategories(tenantId, {
                page: 1,
                limit: 20
            });

            expect(result.categories).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
        });

        it('should filter by status', async () => {
            Category.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([])
            });

            Category.countDocuments = jest.fn().mockResolvedValue(0);

            await categoryService.getCategories(tenantId, {
                status: 'active'
            });

            expect(Category.find).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'active' })
            );
        });
    });

    describe('getCategoryTree', () => {
        it('should return hierarchical category structure', async () => {
            const mockCategories = [
                { _id: '1', name: 'Beverages', parentId: null, level: 0 },
                { _id: '2', name: 'Coffee', parentId: '1', level: 1 },
                { _id: '3', name: 'Tea', parentId: '1', level: 1 }
            ];

            Category.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockCategories)
            });

            const result = await categoryService.getCategoryTree(tenantId);

            expect(result).toHaveLength(1); // Only root categories
            expect(result[0].children).toHaveLength(2); // Two subcategories
        });
    });

    describe('deleteCategory', () => {
        it('should soft delete category', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Category.findOne = jest.fn().mockResolvedValue({
                _id: categoryId,
                name: 'Beverages'
            });

            Category.countDocuments = jest.fn().mockResolvedValue(0);
            Item.countDocuments = jest.fn().mockResolvedValue(0);
            Category.softDelete = jest.fn().mockResolvedValue(true);

            const result = await categoryService.deleteCategory(tenantId, categoryId, userId);

            expect(result.message).toBe('Category deleted successfully');
            expect(Category.softDelete).toHaveBeenCalledWith(categoryId, userId);
        });

        it('should not delete category with children', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Category.findOne = jest.fn().mockResolvedValue({
                _id: categoryId,
                name: 'Beverages'
            });

            Category.countDocuments = jest.fn().mockResolvedValue(2); // Has children

            await expect(
                categoryService.deleteCategory(tenantId, categoryId, userId)
            ).rejects.toThrow('Cannot delete category with subcategories');
        });

        it('should not delete category used in items', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Category.findOne = jest.fn().mockResolvedValue({
                _id: categoryId,
                name: 'Beverages'
            });

            Category.countDocuments = jest.fn().mockResolvedValue(0);
            Item.countDocuments = jest.fn().mockResolvedValue(5); // Used in 5 items

            await expect(
                categoryService.deleteCategory(tenantId, categoryId, userId)
            ).rejects.toThrow('Cannot delete category. It is used by 5 item(s)');
        });
    });

    describe('updateCategory', () => {
        it('should update category successfully', async () => {
            const updateData = { name: 'Hot Beverages' };

            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            const mockCategory = {
                _id: categoryId,
                name: 'Beverages',
                save: jest.fn().mockResolvedValue(true)
            };

            Category.findOne = jest.fn()
                .mockResolvedValueOnce(mockCategory) // Find category
                .mockResolvedValueOnce(null); // Name uniqueness check

            const result = await categoryService.updateCategory(
                tenantId,
                categoryId,
                updateData,
                userId
            );

            expect(mockCategory.save).toHaveBeenCalled();
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });

        it('should prevent circular parent reference', async () => {
            const childId = new mongoose.Types.ObjectId();
            const updateData = { parentId: childId.toString() };

            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            const mockCategory = {
                _id: categoryId,
                name: 'Beverages',
                parentId: null
            };

            Category.findOne = jest.fn().mockResolvedValue(mockCategory);

            // Mock getDescendants to return the child
            categoryService.getDescendants = jest.fn().mockResolvedValue([
                { _id: childId }
            ]);

            await expect(
                categoryService.updateCategory(tenantId, categoryId, updateData, userId)
            ).rejects.toThrow('Cannot set a descendant as parent');
        });
    });
});
