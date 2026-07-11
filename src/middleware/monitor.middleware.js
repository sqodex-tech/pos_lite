const logger = require('../utils/logger');

const monitor = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl } = req;
        const statusCode = res.statusCode;

        // Structured log for monitoring
        const logData = {
            type: 'METRIC',
            method,
            url: originalUrl,
            status: statusCode,
            duration,
            tenantId: req.tenantId || 'anonymous',
            requestId: req.id
        };

        if (duration > 500) {
            logger.warn({ ...logData, alert: 'SLOW_RESPONSE' }, `Slow response detected: ${duration}ms`);
        } else {
            logger.info(logData);
        }

        if (statusCode >= 500) {
            logger.error({ ...logData, alert: 'HIGH_ERROR_RATE' }, `Internal server error on ${originalUrl}`);
        }
    });

    next();
};

module.exports = monitor;
