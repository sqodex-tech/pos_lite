const mongoose = require('mongoose');
const unitService = require('../../src/services/unit.service');
const Unit = require('../../src/models/Unit');
const Item = require('../../src/models/Item');
const ApiError = require('../../src/utils/ApiError');

// Mock dependencies
jest.mock('../../src/models/Unit');
jest.mock('../../src/models/Item');
jest.mock('../../src/utils/logger');

describe('UnitService', () => {
    const tenantId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const unitId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createUnit', () => {
        it('should create a unit successfully', async () => {
            const unitData = {
                name: 'Kilogram',
                symbol: 'kg',
                category: 'weight',
                conversionFactor: 1,
                status: 'active'
            };

            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Unit.findOne = jest.fn().mockResolvedValue(null);
            Unit.prototype.save = jest.fn().mockResolvedValue({
                _id: unitId,
                ...unitData,
                tenantId,
                createdBy: userId
            });

            const result = await unitService.createUnit(tenantId, unitData, userId);

            expect(result).toBeDefined();
            expect(mockSession.commitTransaction).toHaveBeenCalled();
        });

        it('should throw error if unit name already exists', async () => {
            const unitData = { name: 'Kilogram', symbol: 'kg', category: 'weight' };

            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Unit.findOne = jest.fn().mockResolvedValue({ name: 'Kilogram' });

            await expect(
                unitService.createUnit(tenantId, unitData, userId)
            ).rejects.toThrow(ApiError);
        });

        it('should validate base unit category matches', async () => {
            const baseUnitId = new mongoose.Types.ObjectId();
            const unitData = {
                name: 'Gram',
                symbol: 'g',
                category: 'weight',
                baseUnit: baseUnitId.toString(),
                conversionFactor: 0.001
            };

            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Unit.findOne = jest.fn()
                .mockResolvedValueOnce(null) // Name check
                .mockResolvedValueOnce(null) // Symbol check
                .mockResolvedValueOnce({ // Base unit
                    _id: baseUnitId,
                    category: 'volume' // Different category
                });

            await expect(
                unitService.createUnit(tenantId, unitData, userId)
            ).rejects.toThrow('Base unit must be in the same category');
        });
    });

    describe('getUnits', () => {
        it('should return paginated units', async () => {
            const mockUnits = [
                { _id: unitId, name: 'Kilogram', symbol: 'kg', category: 'weight' },
                { _id: new mongoose.Types.ObjectId(), name: 'Gram', symbol: 'g', category: 'weight' }
            ];

            Unit.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockUnits)
            });

            Unit.countDocuments = jest.fn().mockResolvedValue(2);

            const result = await unitService.getUnits(tenantId, {
                page: 1,
                limit: 20
            });

            expect(result.units).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('should filter by category', async () => {
            Unit.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([])
            });

            Unit.countDocuments = jest.fn().mockResolvedValue(0);

            await unitService.getUnits(tenantId, {
                category: 'weight'
            });

            expect(Unit.find).toHaveBeenCalledWith(
                expect.objectContaining({ category: 'weight' })
            );
        });
    });

    describe('convertUnits', () => {
        it('should convert between units successfully', async () => {
            const fromUnitId = new mongoose.Types.ObjectId();
            const toUnitId = new mongoose.Types.ObjectId();

            const mockFromUnit = {
                _id: fromUnitId,
                name: 'Kilogram',
                symbol: 'kg',
                category: 'weight',
                conversionFactor: 1,
                precision: 2,
                toBaseUnit: jest.fn((val) => val * 1)
            };

            const mockToUnit = {
                _id: toUnitId,
                name: 'Gram',
                symbol: 'g',
                category: 'weight',
                conversionFactor: 0.001,
                precision: 0,
                fromBaseUnit: jest.fn((val) => val / 0.001)
            };

            Unit.findOne = jest.fn()
                .mockResolvedValueOnce(mockFromUnit)
                .mockResolvedValueOnce(mockToUnit);

            Unit.convert = jest.fn().mockResolvedValue(1000);

            const result = await unitService.convertUnits(tenantId, 1, fromUnitId, toUnitId);

            expect(result.originalValue).toBe(1);
            expect(result.convertedValue).toBe(1000);
        });

        it('should throw error for different categories', async () => {
            const fromUnitId = new mongoose.Types.ObjectId();
            const toUnitId = new mongoose.Types.ObjectId();

            Unit.findOne = jest.fn()
                .mockResolvedValueOnce({ category: 'weight' })
                .mockResolvedValueOnce({ category: 'volume' });

            await expect(
                unitService.convertUnits(tenantId, 1, fromUnitId, toUnitId)
            ).rejects.toThrow('Cannot convert between different unit categories');
        });
    });

    describe('deleteUnit', () => {
        it('should soft delete unit', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Unit.findOne = jest.fn().mockResolvedValue({
                _id: unitId,
                name: 'Kilogram'
            });

            Unit.countDocuments = jest.fn().mockResolvedValue(0);
            Item.countDocuments = jest.fn().mockResolvedValue(0);
            Unit.softDelete = jest.fn().mockResolvedValue(true);

            const result = await unitService.deleteUnit(tenantId, unitId, userId);

            expect(result.message).toBe('Unit deleted successfully');
            expect(Unit.softDelete).toHaveBeenCalledWith(unitId, userId);
        });

        it('should not delete unit used as base unit', async () => {
            const mockSession = {
                startTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn()
            };

            mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

            Unit.findOne = jest.fn().mockResolvedValue({
                _id: unitId,
                name: 'Kilogram'
            });

            Unit.countDocuments = jest.fn().mockResolvedValue(3); // Used as base

            await expect(
                unitService.deleteUnit(tenantId, unitId, userId)
            ).rejects.toThrow('Cannot delete unit. It is used as base unit by 3 other unit(s)');
        });
    });
});
