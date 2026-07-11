const brandRepository = require('../repositories/brand.repository');
const ApiError = require('../utils/ApiError');

class BrandService {
    async createBrand(tenantId, data, storeId) {
        return await brandRepository.create(tenantId, data, storeId);
    }

    async getBrandById(tenantId, id, storeId = null) {
        const brand = await brandRepository.findById(tenantId, id, storeId);
        if (!brand) {
            throw new ApiError(404, 'Brand not found');
        }
        return brand;
    }

    async getBrands(tenantId, params) {
        return await brandRepository.findAll(tenantId, params);
    }

    async updateBrand(tenantId, id, data, storeId = null) {
        const brand = await brandRepository.update(tenantId, id, data, storeId);
        if (!brand) {
            throw new ApiError(404, 'Brand not found');
        }
        return brand;
    }

    async deleteBrand(tenantId, id, storeId = null) {
        const brand = await brandRepository.delete(tenantId, id, storeId);
        if (!brand) {
            throw new ApiError(404, 'Brand not found');
        }
        return brand;
    }
}

module.exports = new BrandService();
