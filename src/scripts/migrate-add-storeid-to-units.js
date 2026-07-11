/**
 * Migration Script: Add storeId to existing units
 * 
 * This script adds storeId to units that don't have one.
 * It assigns the tenant's first store as the default storeId.
 */

const mongoose = require('mongoose');
const Unit = require('../models/Unit');
const Store = require('../models/Store');
const logger = require('../utils/logger');
require('dotenv').config();

const migrateUnits = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sumboxpro');
        console.log('Connected to MongoDB');

        // Find all units without storeId
        const unitsWithoutStore = await Unit.find({
            $or: [
                { storeId: { $exists: false } },
                { storeId: null }
            ]
        }).populate('tenantId');

        console.log(`Found ${unitsWithoutStore.length} units without storeId`);

        if (unitsWithoutStore.length === 0) {
            console.log('No units need migration');
            process.exit(0);
        }

        let updated = 0;
        let failed = 0;

        for (const unit of unitsWithoutStore) {
            try {
                // Get the first store for this tenant
                const store = await Store.findOne({ 
                    tenantId: unit.tenantId,
                    status: 'active'
                }).sort({ createdAt: 1 });

                if (!store) {
                    console.warn(`No store found for tenant ${unit.tenantId}. Skipping unit ${unit._id}`);
                    failed++;
                    continue;
                }

                // Update unit with storeId
                unit.storeId = store._id;
                await unit.save();

                console.log(`✓ Updated unit ${unit._id} (${unit.name}) with storeId ${store._id}`);
                updated++;
            } catch (error) {
                console.error(`✗ Failed to update unit ${unit._id}:`, error.message);
                failed++;
            }
        }

        console.log('\n=== Migration Summary ===');
        console.log(`Total units processed: ${unitsWithoutStore.length}`);
        console.log(`Successfully updated: ${updated}`);
        console.log(`Failed: ${failed}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

// Run migration
migrateUnits();
