const cron = require('node-cron');
const BillingService = require('../services/billing.service');
const logger = require('./logger');

class BillingScheduler {
    constructor() {
        this.jobs = {};
    }

    /**
     * Initialize all billing-related cron jobs
     */
    init() {
        logger.info('Initializing billing scheduler...');

        // Daily billing processing at 2 AM
        this.jobs.dailyBilling = cron.schedule('0 2 * * *', async () => {
            logger.info('Running daily billing process...');
            try {
                const result = await BillingService.processRecurringBilling();
                logger.info(`Daily billing completed: ${result.processedCount} processed, ${result.successCount} successful, ${result.failedCount} failed`);
            } catch (error) {
                logger.error('Error in daily billing process:', error);
            }
        }, {
            scheduled: true,
            timezone: 'UTC'
        });

        // Add more jobs here as they are refactored (e.g., retry payments, overdue accounts)

        logger.info('Billing scheduler initialized successfully');
    }

    /**
     * Stop all scheduled jobs
     */
    stop() {
        Object.values(this.jobs).forEach(job => {
            if (job) job.stop();
        });
        logger.info('Billing scheduler stopped');
    }

    /**
     * Get status of all jobs
     */
    getStatus() {
        const status = {};
        Object.entries(this.jobs).forEach(([name, job]) => {
            status[name] = {
                running: job ? !job.stopped : false,
                nextExecution: job ? job.nextDate() : null
            };
        });
        return status;
    }
}

module.exports = new BillingScheduler();