const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

// More lenient rate limiting for development
const isDevelopment = process.env.NODE_ENV === 'development';

// Global limiter — applied to all routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 10000 : 1000, // 5000 requests in dev, 500 in production
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    handler: (req, res, next) => {
        next(new ApiError(429, 'Too many requests from this IP, please try again after 15 minutes'));
    }
});

// Strict limiter — applied to sensitive endpoints (registration, store creation)
const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: isDevelopment ? 200 : 10, // 10 req/hour in production
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    handler: (req, res, next) => {
        next(new ApiError(429, 'Too many registration/creation attempts. Please try again in 1 hour.'));
    }
});

module.exports = { limiter, strictLimiter };
