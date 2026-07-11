const transactionRepository = require('../repositories/transaction.repository');
const transactionService = require('../services/transaction.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache.service');

const createTransaction = async (req, res, next) => {
    try {
        const transaction = await transactionService.createTransaction(
            req.body,
            req.tenantId,
            req.user.id
        );
        cache.delStartWith(`transactions_${req.tenantId}`);
        cache.delStartWith(`pos_dashboard_${req.tenantId}`);
        return res.status(201).json(
            new ApiResponse(201, transaction, 'Transaction completed successfully')
        );
    } catch (error) {
        next(error);
    }
};

const getPartyStatement = async (req, res, next) => {
    try {
        const { partyId } = req.params;
        const { partyType, startDate, endDate } = req.query;
        const storeId = req.headers['x-store-id'];

        if (!startDate || !endDate) {
            throw new ApiError(400, 'Start date and End date are required');
        }

        const statement = await transactionService.getPartyStatement(
            req.tenantId, storeId, partyId, partyType, startDate, endDate
        );

        return res.status(200).json(new ApiResponse(200, statement, 'Statement fetched successfully'));
    } catch (error) {
        next(error);
    }
};

const getDashboardSummary = async (req, res, next) => {
    try {
        const storeId = req.headers['x-store-id'];
        const cacheKey = `pos_dashboard_${req.tenantId}_${storeId}`;
        
        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json(new ApiResponse(200, cached, 'Dashboard summary fetched (cached)'));

        const summary = await transactionService.getDashboardData(req.tenantId, storeId);
        cache.set(cacheKey, summary, 300); // Cache for 5 mins

        return res.status(200).json(new ApiResponse(200, summary, 'Dashboard summary fetched successfully'));
    } catch (error) {
        next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const { page = 1, limit = 20, type } = req.query;
        const cacheKey = `transactions_${req.tenantId}_${storeId || ''}_${page}_${limit}_${type || ''}`;

        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(new ApiResponse(200, cachedData.transactions, 'Transactions fetched successfully (cached)', cachedData.meta));
        }

        const result = await transactionRepository.findByTenant(req.tenantId, storeId, {
            page: parseInt(page),
            limit: parseInt(limit),
            type
        });

        const totalPages = Math.ceil(result.total / result.limit);
        const meta = {
            total: result.total,
            page: result.page,
            totalPages,
            hasMore: result.page < totalPages
        };

        cache.set(cacheKey, { transactions: result.transactions, meta });

        return res.status(200).json(
            new ApiResponse(200, result.transactions, 'Transactions fetched successfully', meta)
        );
    } catch (error) {
        next(error);
    }
};

const getTransactionById = async (req, res, next) => {
    try {
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId || req.headers['x-store-id'];
        const transaction = await transactionRepository.findById(req.tenantId, req.params.id, storeId);
        if (!transaction) throw new ApiError(404, 'Transaction not found');

        return res.status(200).json(new ApiResponse(200, transaction, 'Transaction fetched successfully'));
    } catch (error) {
        next(error);
    }
};

const deleteTransaction = async (req, res, next) => {
    try {
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId || req.headers['x-store-id'];
        const transaction = await transactionRepository.delete(req.tenantId, req.params.id, storeId);
        if (!transaction) throw new ApiError(404, 'Transaction not found');

        cache.delStartWith(`transactions_${req.tenantId}`);
        return res.status(200).json(new ApiResponse(200, null, 'Transaction cancelled/deleted successfully'));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    getPartyStatement,
    getDashboardSummary,
    deleteTransaction
};
