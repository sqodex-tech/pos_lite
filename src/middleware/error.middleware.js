const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;

    if (!(err instanceof ApiError)) {
        statusCode = err.statusCode || 500;
        message = err.message || 'Internal Server Error';
    }

    const response = {
        data: null,
        meta: null,
        error: {
            message,
            code: statusCode,
            errors: err.errors || [],
            requestId: req.id,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    };

    logger.error({
        message,
        method: req.method,
        url: req.url,
        statusCode,
        stack: err.stack
    });

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
