const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/error.middleware');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const storeRoutes = require('./routes/store.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const categoryRoutes = require('./routes/category.routes');
const unitRoutes = require('./routes/unit.routes');
const transactionRoutes = require('./routes/transaction.routes');
const expenseRoutes = require('./routes/expense.routes');
const reportRoutes = require('./routes/report.routes');
const tenantRoutes = require('./routes/tenant.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const billingRoutes = require('./routes/billing.routes');
const customerRoutes = require('./routes/customer.routes');
const supplierRoutes = require('./routes/supplier.routes');
const permissionRoutes = require('./routes/permission.routes');
const brandRoutes = require('./routes/brand.routes');
const billingScheduler = require('./utils/billing.scheduler');
const notificationScheduler = require('./cron/notificationScheduler');
const requestId = require('./middleware/requestId.middleware');
const { limiter } = require('./middleware/rateLimiter.middleware');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(path.join(__dirname, './docs/swagger.yaml'));

const monitor = require('./middleware/monitor.middleware');

const app = express();

// Initialize schedulers
billingScheduler.init();
notificationScheduler.init();

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Security & Monitoring Middleware
app.use(requestId);
app.use(monitor);
app.use(limiter);

// 3. CORS - More robust for multi-origin dashboard
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3005',
            'http://localhost:5001',
            'http://localhost:5002',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-store-id'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Helmet - Adjusted for specific needs if necessary
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false
}));

// Request Logger (Custom implementation for simplicity or use pino-http)
app.use((req, res, next) => {
    req.startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// Parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/units', unitRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/brands', brandRoutes);

// Error Handling
app.use(errorHandler);

module.exports = app;
