const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class UnitService {
    /**
     * Create a new unit
     */
    async createUnit(tenantId, storeId, data, userId) {
        return await prisma.$transaction(async (tx) => {
            try {
                // Validate storeId is provided
                if (!storeId) {
                    throw new ApiError(400, 'storeId is required');
                }

                // Check if unit name already exists in this store
                const existingUnit = await tx.unit.findFirst({
                    where: {
                        tenantId,
                        storeId,
                        name: data.name,
                        deletedAt: null
                    }
                });

                if (existingUnit) {
                    throw new ApiError(400, `Unit '${data.name}' already exists in this store`);
                }

                // Check if symbol already exists in this store
                const existingSymbol = await tx.unit.findFirst({
                    where: {
                        tenantId,
                        storeId,
                        symbol: data.symbol,
                        deletedAt: null
                    }
                });

                if (existingSymbol) {
                    throw new ApiError(400, `Unit symbol '${data.symbol}' already exists in this store`);
                }

                // Validate base unit if provided
                if (data.baseUnit) {
                    const baseUnit = await tx.unit.findFirst({
                        where: {
                            id: data.baseUnit,
                            tenantId,
                            storeId,
                            deletedAt: null
                        }
                    });

                    if (!baseUnit) {
                        throw new ApiError(404, 'Base unit not found in this store');
                    }

                    // Ensure same category
                    if (baseUnit.category !== data.category) {
                        throw new ApiError(400, 'Base unit must be in the same category');
                    }

                    // Ensure conversion factor is provided
                    if (!data.conversionFactor || data.conversionFactor === 1) {
                        throw new ApiError(400, 'Conversion factor is required when base unit is specified');
                    }
                }

                const baseUnitId = data.baseUnit || null;
                delete data.baseUnit;

                const unit = await tx.unit.create({
                    data: {
                        ...data,
                        baseUnitId,
                        tenantId,
                        storeId,
                        createdById: userId
                    }
                });

                logger.info(`Unit created: ${unit.id} in store ${storeId} by user ${userId}`);
                return unit;
            } catch (error) {
                logger.error(`Error creating unit: ${error.message}`);
                throw error;
            }
        });
    }

    /**
     * Get all units with pagination and filters
     */
    async getUnits(tenantId, storeId, options = {}) {
        try {
            // Validate storeId is provided
            if (!storeId) {
                throw new ApiError(400, 'storeId is required');
            }

            const {
                page = 1,
                limit = 20,
                search,
                category,
                status,
                includeDeleted = false
            } = options;

            const where = { tenantId, storeId };

            // Filter by deletion status
            if (!includeDeleted) {
                where.deletedAt = null;
            }

            // Filter by status
            if (status && status !== 'all') {
                where.status = status;
            }

            // Filter by category
            if (category && category !== 'all') {
                where.category = category;
            }

            // Search by name, symbol, or description
            if (search) {
                where.OR = [
                    { name: { contains: search } },
                    { symbol: { contains: search } },
                    { description: { contains: search } }
                ];
            }

            const limitNum = parseInt(limit);
            const pageNum = parseInt(page);
            const skip = (pageNum - 1) * limitNum;

            const [units, total] = await Promise.all([
                prisma.unit.findMany({
                    where,
                    include: {
                        baseUnit: { select: { name: true, symbol: true, conversionFactor: true } },
                        createdBy: { select: { name: true, email: true } },
                        updatedBy: { select: { name: true, email: true } }
                    },
                    orderBy: [
                        { category: 'asc' },
                        { name: 'asc' }
                    ],
                    skip,
                    take: limitNum
                }),
                prisma.unit.count({ where })
            ]);

            return {
                units,
                total,
                page: pageNum,
                limit: limitNum
            };
        } catch (error) {
            logger.error(`Error fetching units: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get units grouped by category
     */
    async getUnitsByCategory(tenantId, storeId) {
        try {
            // Validate storeId is provided
            if (!storeId) {
                throw new ApiError(400, 'storeId is required');
            }

            const units = await prisma.unit.findMany({
                where: {
                    tenantId,
                    storeId,
                    deletedAt: null,
                    status: 'active'
                },
                include: {
                    baseUnit: { select: { name: true, symbol: true } }
                },
                orderBy: [
                    { category: 'asc' },
                    { name: 'asc' }
                ]
            });

            // Group by category
            const grouped = units.reduce((acc, unit) => {
                if (!acc[unit.category]) {
                    acc[unit.category] = [];
                }
                acc[unit.category].push(unit);
                return acc;
            }, {});

            return grouped;
        } catch (error) {
            logger.error(`Error fetching units by category: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get unit by ID
     */
    async getUnitById(tenantId, storeId, unitId) {
        try {
            // Validate storeId is provided
            if (!storeId) {
                throw new ApiError(400, 'storeId is required');
            }

            const unit = await prisma.unit.findFirst({
                where: {
                    id: unitId,
                    tenantId,
                    storeId,
                    deletedAt: null
                },
                include: {
                    baseUnit: { select: { name: true, symbol: true, conversionFactor: true } },
                    createdBy: { select: { name: true, email: true } },
                    updatedBy: { select: { name: true, email: true } }
                }
            });

            if (!unit) {
                throw new ApiError(404, 'Unit not found in this store');
            }

            return unit;
        } catch (error) {
            logger.error(`Error fetching unit: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update unit
     */
    async updateUnit(tenantId, storeId, unitId, data, userId) {
        return await prisma.$transaction(async (tx) => {
            try {
                // Validate storeId is provided
                if (!storeId) {
                    throw new ApiError(400, 'storeId is required');
                }

                const unit = await tx.unit.findFirst({
                    where: {
                        id: unitId,
                        tenantId,
                        storeId,
                        deletedAt: null
                    }
                });

                if (!unit) {
                    throw new ApiError(404, 'Unit not found in this store');
                }

                // Prevent storeId changes
                if (data.storeId && data.storeId !== storeId) {
                    throw new ApiError(400, 'Cannot change unit store assignment');
                }

                // Check if name is being changed and already exists in this store
                if (data.name && data.name !== unit.name) {
                    const existingUnit = await tx.unit.findFirst({
                        where: {
                            tenantId,
                            storeId,
                            name: data.name,
                            id: { not: unitId },
                            deletedAt: null
                        }
                    });

                    if (existingUnit) {
                        throw new ApiError(400, `Unit '${data.name}' already exists in this store`);
                    }
                }

                // Check if symbol is being changed and already exists in this store
                if (data.symbol && data.symbol !== unit.symbol) {
                    const existingSymbol = await tx.unit.findFirst({
                        where: {
                            tenantId,
                            storeId,
                            symbol: data.symbol,
                            id: { not: unitId },
                            deletedAt: null
                        }
                    });

                    if (existingSymbol) {
                        throw new ApiError(400, `Unit symbol '${data.symbol}' already exists in this store`);
                    }
                }

                // Validate base unit change
                if (data.baseUnit !== undefined && data.baseUnit !== unit.baseUnitId) {
                    if (data.baseUnit) {
                        // Check if trying to set self as base
                        if (data.baseUnit === unitId) {
                            throw new ApiError(400, 'Unit cannot be its own base unit');
                        }

                        const baseUnit = await tx.unit.findFirst({
                            where: {
                                id: data.baseUnit,
                                tenantId,
                                storeId,
                                deletedAt: null
                            }
                        });

                        if (!baseUnit) {
                            throw new ApiError(404, 'Base unit not found in this store');
                        }

                        const category = data.category || unit.category;
                        if (baseUnit.category !== category) {
                            throw new ApiError(400, 'Base unit must be in the same category');
                        }
                    }
                }

                // Sync check: If deactivating or deleting, check for dependent items
                const syncService = require('./sync.service');
                await syncService.syncItemsOnUnitUpdate(tenantId, storeId, unitId, data, tx);

                const updateData = { ...data, updatedById: userId };
                if (data.baseUnit !== undefined) {
                    updateData.baseUnitId = data.baseUnit || null;
                    delete updateData.baseUnit;
                }

                const updatedUnit = await tx.unit.update({
                    where: { id: unitId },
                    data: updateData
                });

                logger.info(`Unit updated: ${unitId} in store ${storeId} by user ${userId}`);
                return updatedUnit;
            } catch (error) {
                logger.error(`Error updating unit: ${error.message}`);
                throw error;
            }
        });
    }

    /**
     * Delete unit (soft delete)
     */
    async deleteUnit(tenantId, storeId, unitId, userId) {
        return await prisma.$transaction(async (tx) => {
            try {
                // Validate storeId is provided
                if (!storeId) {
                    throw new ApiError(400, 'storeId is required');
                }

                const unit = await tx.unit.findFirst({
                    where: {
                        id: unitId,
                        tenantId,
                        storeId,
                        deletedAt: null
                    }
                });

                if (!unit) {
                    throw new ApiError(404, 'Unit not found in this store');
                }

                // Check if unit is used as base unit for other units in this store
                const dependentUnits = await tx.unit.count({
                    where: {
                        baseUnitId: unitId,
                        tenantId,
                        storeId,
                        deletedAt: null
                    }
                });

                if (dependentUnits > 0) {
                    throw new ApiError(400, `Cannot delete unit. It is used as base unit by ${dependentUnits} other unit(s).`);
                }

                // Check if unit is used in items in this store
                const itemsCount = await tx.item.count({
                    where: {
                        unitId: unitId,
                        tenantId,
                        storeId,
                        deletedAt: null
                    }
                });

                if (itemsCount > 0) {
                    throw new ApiError(400, `Cannot delete unit. It is used by ${itemsCount} item(s).`);
                }

                await tx.unit.update({
                    where: { id: unitId },
                    data: {
                        deletedAt: new Date(),
                        status: 'inactive',
                        updatedById: userId
                    }
                });

                logger.info(`Unit deleted: ${unitId} in store ${storeId} by user ${userId}`);
                return { message: 'Unit deleted successfully' };
            } catch (error) {
                logger.error(`Error deleting unit: ${error.message}`);
                throw error;
            }
        });
    }

    /**
     * Restore deleted unit
     */
    async restoreUnit(tenantId, storeId, unitId, userId) {
        try {
            // Validate storeId is provided
            if (!storeId) {
                throw new ApiError(400, 'storeId is required');
            }

            const unit = await prisma.unit.findFirst({
                where: {
                    id: unitId,
                    tenantId,
                    storeId,
                    deletedAt: { not: null }
                }
            });

            if (!unit) {
                throw new ApiError(404, 'Deleted unit not found in this store');
            }

            await prisma.unit.update({
                where: { id: unitId },
                data: {
                    deletedAt: null,
                    status: 'active',
                    updatedById: userId
                }
            });

            logger.info(`Unit restored: ${unitId} in store ${storeId} by user ${userId}`);
            return { message: 'Unit restored successfully' };
        } catch (error) {
            logger.error(`Error restoring unit: ${error.message}`);
            throw error;
        }
    }

    /**
     * Convert value between units
     */
    async convertUnits(tenantId, storeId, value, fromUnitId, toUnitId) {
        try {
            // Validate storeId is provided
            if (!storeId) {
                throw new ApiError(400, 'storeId is required');
            }

            const [fromUnit, toUnit] = await Promise.all([
                prisma.unit.findFirst({ where: { id: fromUnitId, tenantId, storeId, deletedAt: null } }),
                prisma.unit.findFirst({ where: { id: toUnitId, tenantId, storeId, deletedAt: null } })
            ]);

            if (!fromUnit) {
                throw new ApiError(404, 'Source unit not found in this store');
            }

            if (!toUnit) {
                throw new ApiError(404, 'Target unit not found in this store');
            }

            if (fromUnit.category !== toUnit.category) {
                throw new ApiError(400, `Cannot convert between different unit categories (${fromUnit.category} to ${toUnit.category})`);
            }

            // Convert Logic: value * (fromUnit.conversionFactor / toUnit.conversionFactor)
            const convertedValue = value * (fromUnit.conversionFactor / toUnit.conversionFactor);

            return {
                originalValue: value,
                originalUnit: {
                    id: fromUnit.id,
                    name: fromUnit.name,
                    symbol: fromUnit.symbol
                },
                convertedValue: parseFloat(convertedValue.toFixed(toUnit.precision || 2)),
                convertedUnit: {
                    id: toUnit.id,
                    name: toUnit.name,
                    symbol: toUnit.symbol
                },
                formula: `${value} ${fromUnit.symbol} × ${fromUnit.conversionFactor} ÷ ${toUnit.conversionFactor} = ${convertedValue.toFixed(toUnit.precision || 2)} ${toUnit.symbol}`
            };
        } catch (error) {
            logger.error(`Error converting units: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new UnitService();
