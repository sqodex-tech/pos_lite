const brandService = require('../services/brand.service');
const ApiResponse = require('../utils/ApiResponse');

const createBrand = async (req, res, next) => {
    try {
        const storeId = req.query.storeId || req.permissionContext?.storeId || req.body.storeId;
        const brand = await brandService.createBrand(req.tenantId, { ...req.body, createdById: req.user.id }, storeId);
        return res.status(201).json(new ApiResponse(201, brand, 'Brand created successfully'));
    } catch (error) {
        next(error);
    }
};

const getBrands = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, status, storeId: queryStoreId } = req.query;
        const storeId = queryStoreId || req.permissionContext?.storeId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const result = await brandService.getBrands(req.tenantId, {
            storeId,
            status,
            search,
            skip,
            take
        });

        const meta = {
            page: parseInt(page),
            limit: parseInt(limit),
            total: result.total,
            pages: Math.ceil(result.total / parseInt(limit))
        };

        return res.status(200).json(new ApiResponse(200, result.brands, 'Brands retrieved successfully', meta));
    } catch (error) {
        next(error);
    }
};

const getBrandById = async (req, res, next) => {
    try {
        const storeId = req.query.storeId || req.permissionContext?.storeId;
        const brand = await brandService.getBrandById(req.tenantId, req.params.id, storeId);
        return res.status(200).json(new ApiResponse(200, brand, 'Brand retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

const updateBrand = async (req, res, next) => {
    try {
        const storeId = req.query.storeId || req.permissionContext?.storeId;
        const brand = await brandService.updateBrand(req.tenantId, req.params.id, { ...req.body, updatedById: req.user.id }, storeId);
        return res.status(200).json(new ApiResponse(200, brand, 'Brand updated successfully'));
    } catch (error) {
        next(error);
    }
};

const deleteBrand = async (req, res, next) => {
    try {
        const storeId = req.query.storeId || req.permissionContext?.storeId;
        await brandService.deleteBrand(req.tenantId, req.params.id, storeId);
        return res.status(200).json(new ApiResponse(200, null, 'Brand deleted successfully'));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand
};
