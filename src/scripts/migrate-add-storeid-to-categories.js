/**
 * Migration Script: Add storeId to existing categories
 * 
 * This script adds storeId to categories that don't have one.
 * It assigns the tenant's first store as the default storeId.
 */

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Store = require('../models/Store');
const logger = require('../utils/logger');
require('dotenv').config();

const migrateCategories = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sumboxpro');
        console.log('Connected to MongoDB');

        // Find all categories without storeId
        const categoriesWithoutStore = await Category.find({
            $or: [
                { storeId: { $exists: false } },
                { storeId: null }
            ]
        }).populate('tenantId');

        console.log(`Found ${categoriesWithoutStore.length} categories without storeId`);

        if (categoriesWithoutStore.length === 0) {
            console.log('No categories need migration');
            process.exit(0);
        }

        let updated = 0;
        let failed = 0;

        for (const category of categoriesWithoutStore) {
            try {
                // Get the first store for this tenant
                const store = await Store.findOne({ 
                    tenantId: category.tenantId,
                    status: 'active'
                }).sort({ createdAt: 1 });

                if (!store) {
                    console.warn(`No store found for tenant ${category.tenantId}. Skipping category ${category._id}`);
                    failed++;
                    continue;
                }

                // Update category with storeId
                category.storeId = store._id;
                await category.save();

                console.log(`✓ Updated category ${category._id} (${category.name}) with storeId ${store._id}`);
                updated++;
            } catch (error) {
                console.error(`✗ Failed to update category ${category._id}:`, error.message);
                failed++;
            }
        }

        console.log('\n=== Migration Summary ===');
        console.log(`Total categories processed: ${categoriesWithoutStore.length}`);
        console.log(`Successfully updated: ${updated}`);
        console.log(`Failed: ${failed}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

// Run migration
migrateCategories();
