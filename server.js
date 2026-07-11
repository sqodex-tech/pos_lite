const express = require('express');
const next = require('next');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Import Express backend application
const backendApp = require('./src/app');
const logger = require('./src/utils/logger');
const paymentReminders = require('./src/cron/paymentReminders');

const PORT = process.env.PORT || 3000;

nextApp.prepare().then(() => {
    
    // Fallback handler for all non-API routes (Next.js pages, static files)
    backendApp.use((req, res) => {
        return handle(req, res);
    });

    // Start the server directly since Prisma handles its own connections
    backendApp.listen(PORT, (err) => {
        if (err) throw err;
        logger.info(`> Ready on http://localhost:${PORT}`);
        
        // Start background jobs
        paymentReminders.init();
    });
});
