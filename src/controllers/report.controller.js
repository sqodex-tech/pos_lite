const reportService = require('../services/report.service');
const ApiResponse = require('../utils/ApiResponse');

const getProfitLoss = async (req, res, next) => {
    try {
        const { storeId, startDate, endDate } = req.query;
        const result = await reportService.getProfitLoss(req.tenantId, {
            storeId, startDate, endDate
        });
        return res.status(200).json(new ApiResponse(200, result, 'Profit & Loss report generated'));
    } catch (error) {
        next(error);
    }
};

const getCashFlow = async (req, res, next) => {
    try {
        const { storeId, startDate, endDate } = req.query;
        const result = await reportService.getCashFlow(req.tenantId, {
            storeId, startDate, endDate
        });
        return res.status(200).json(new ApiResponse(200, result, 'Cash Flow report generated'));
    } catch (error) {
        next(error);
    }
};

const getAgingReport = async (req, res, next) => {
    try {
        const { storeId, type } = req.query; // type: 'AR' or 'AP'
        if (!type || !['AR', 'AP'].includes(type)) {
            return res.status(400).json(new ApiResponse(400, null, "type query param must be 'AR' or 'AP'"));
        }
        const result = await reportService.getAgingReport(req.tenantId, type, {
            storeId
        });
        return res.status(200).json(new ApiResponse(200, result, `Aging Report (${type}) generated`));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfitLoss,
    getCashFlow,
    getAgingReport
};
