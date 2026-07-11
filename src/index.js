require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const paymentReminders = require('./cron/paymentReminders');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        // Start background jobs
        paymentReminders.init();
    });
}).catch((err) => {
    logger.error('MongoDB connection failed', err);
    process.exit(1);
});
