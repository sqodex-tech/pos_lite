const cron = require('node-cron');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

// Run every day at 08:00 AM
const paymentRemindersJob = cron.schedule('0 8 * * *', async () => {
    logger.info('Running payment reminders job...');
    try {
        const today = new Date();
        const overdueTransactions = await prisma.transaction.findMany({
            where: {
                status: 'PENDING',
                dueDate: { lt: today },
                deletedAt: null
            },
            include: {
                customer: true,
                supplier: true,
                user: true,
                tenant: true
            }
        });

        if (overdueTransactions.length === 0) {
            logger.info('No overdue payments found today.');
            return;
        }

        // Processing grouped by tenant and entity
        for (const trx of overdueTransactions) {
            // Here you would integrate with an email or SMS notification service
            // e.g., notificationService.sendOverdueReminder(trx.customerId, trx.total, trx.dueDate);
            const entity = trx.type === 'SALE' ? trx.customer : trx.supplier;
            const entityType = trx.type === 'SALE' ? 'Customer' : 'Supplier';
            const name = entity ? entity.name : 'Unknown';

            logger.info(`OVERDUE REMINDER: ${entityType} ${name} owes/is owed ${trx.total} since ${trx.dueDate}. Tenant: ${trx.tenantId}`);
        }
    } catch (error) {
        logger.error('Error running payment reminders job', error);
    }
}, {
    scheduled: false // We will start it manually
});

module.exports = {
    init: () => {
        paymentRemindersJob.start();
        logger.info('Payment reminders cron job initialized');
    }
};
