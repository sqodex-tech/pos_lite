const prisma = require('../config/prisma');

class ReportService {
    async getProfitLoss(tenantId, options = {}) {
        const { storeId, startDate, endDate } = options;

        if (!startDate || !endDate) {
            throw new Error('startDate and endDate are required for profit/loss report');
        }

        const match = { tenantId, deletedAt: null };
        if (storeId && storeId !== 'all') {
            match.storeId = storeId;
        }
        
        const dateMatch = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };

        // Get store info
        let storeInfo = 'All Stores';
        if (storeId && storeId !== 'all') {
            const store = await prisma.store.findUnique({ where: { id: storeId } });
            storeInfo = store ? { id: store.id, name: store.name, code: store.code } : 'Unknown Store';
        }

        // Sales data
        const salesData = await prisma.transaction.aggregate({
            where: { ...match, type: 'SALE', date: dateMatch },
            _sum: { total: true, discount: true, tax: true },
            _count: { id: true }
        });

        // Sales by payment method
        const salesByMethod = await prisma.transaction.groupBy({
            by: ['paymentMethod'],
            where: { ...match, type: 'SALE', date: dateMatch },
            _sum: { total: true },
            _count: { id: true }
        });

        // Purchase data
        const purchaseData = await prisma.transaction.aggregate({
            where: { ...match, type: 'PURCHASE', date: dateMatch },
            _sum: { total: true },
            _count: { id: true }
        });

        // Expense data
        const expenseMatch = { ...match, expenseDate: dateMatch };
        
        const expenseData = await prisma.expense.aggregate({
            where: expenseMatch,
            _sum: { amount: true },
            _count: { id: true }
        });

        // Expense by category
        const expenses = await prisma.expense.findMany({
            where: expenseMatch,
            include: { category: true }
        });

        const categoryMap = {};
        expenses.forEach(e => {
            const catId = e.categoryId || 'uncategorized';
            const catName = e.category ? e.category.name : 'Uncategorized';
            if (!categoryMap[catId]) {
                categoryMap[catId] = { categoryId: catId, category: catName, amount: 0, count: 0 };
            }
            categoryMap[catId].amount += e.amount;
            categoryMap[catId].count += 1;
        });
        const expenseByCategory = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);

        // Daily breakdown for chart
        const transactions = await prisma.transaction.findMany({
            where: { ...match, type: { in: ['SALE', 'PURCHASE'] }, date: dateMatch },
            select: { date: true, type: true, total: true }
        });

        const chartData = {};
        
        transactions.forEach(t => {
            const dateStr = t.date.toISOString().split('T')[0];
            if (!chartData[dateStr]) {
                chartData[dateStr] = { date: dateStr, sales: 0, purchases: 0, expenses: 0, profit: 0 };
            }
            if (t.type === 'SALE') {
                chartData[dateStr].sales += t.total;
            } else if (t.type === 'PURCHASE') {
                chartData[dateStr].purchases += t.total;
            }
        });

        expenses.forEach(e => {
            const dateStr = e.expenseDate.toISOString().split('T')[0];
            if (!chartData[dateStr]) {
                chartData[dateStr] = { date: dateStr, sales: 0, purchases: 0, expenses: 0, profit: 0 };
            }
            chartData[dateStr].expenses += e.amount;
        });

        // Calculate daily profit
        Object.values(chartData).forEach(day => {
            day.profit = day.sales - day.purchases - day.expenses;
        });

        // Calculate totals
        const totals = {
            sales: salesData._sum.total || 0,
            purchases: purchaseData._sum.total || 0,
            expenses: expenseData._sum.amount || 0,
            discounts: salesData._sum.discount || 0,
            tax: salesData._sum.tax || 0
        };

        const salesCount = salesData._count.id || 0;
        const grossProfit = totals.sales - totals.purchases;
        const netProfit = grossProfit - totals.expenses;
        const profitMargin = totals.sales > 0 ? ((netProfit / totals.sales) * 100).toFixed(2) : 0;

        return {
            period: {
                startDate,
                endDate,
                store: storeInfo
            },
            revenue: {
                totalSales: totals.sales,
                salesCount,
                averageSale: salesCount > 0 ? (totals.sales / salesCount).toFixed(2) : 0,
                totalDiscount: totals.discounts,
                totalTax: totals.tax
            },
            costs: {
                totalPurchases: totals.purchases,
                purchaseCount: purchaseData._count.id || 0,
                totalExpenses: totals.expenses,
                expenseCount: expenseData._count.id || 0,
                totalCosts: totals.purchases + totals.expenses
            },
            profit: {
                grossProfit,
                netProfit,
                profitMargin: parseFloat(profitMargin)
            },
            breakdown: {
                bySaleType: salesByMethod.map(s => ({
                    type: s.paymentMethod,
                    amount: s._sum.total,
                    count: s._count.id
                })),
                byExpenseCategory: expenseByCategory
            },
            chartData: {
                daily: Object.values(chartData).sort((a, b) => a.date.localeCompare(b.date))
            }
        };
    }

    async getCashFlow(tenantId, options = {}) {
        const { storeId, startDate, endDate } = options;

        const match = { tenantId, deletedAt: null };
        if (storeId) match.storeId = storeId;
        if (startDate || endDate) {
            match.date = {};
            if (startDate) match.date.gte = new Date(startDate);
            if (endDate) match.date.lte = new Date(endDate);
        }

        const flowData = await prisma.cashLedger.groupBy({
            by: ['type'],
            where: match,
            _sum: { amount: true }
        });

        const cashIn = flowData.find(d => d.type === 'IN')?._sum.amount || 0;
        const cashOut = flowData.find(d => d.type === 'OUT')?._sum.amount || 0;

        return {
            cashIn,
            cashOut,
            netCashFlow: cashIn - cashOut
        };
    }

    async getAgingReport(tenantId, type, options = {}) {
        const { storeId } = options;

        const match = {
            tenantId,
            status: 'PENDING',
            deletedAt: null
        };

        if (storeId) match.storeId = storeId;

        if (type === 'AR') {
            match.type = 'SALE';
            match.customerId = { not: null };
        } else if (type === 'AP') {
            match.type = 'PURCHASE';
            match.supplierId = { not: null };
        } else {
            throw new Error("Invalid aging report type. Use AR (Accounts Receivable) or AP (Accounts Payable).");
        }

        const transactions = await prisma.transaction.findMany({
            where: match,
            include: {
                customer: type === 'AR' ? { select: { id: true, name: true, phone: true } } : false,
                supplier: type === 'AP' ? { select: { id: true, name: true, phone: true } } : false
            }
        });

        const grouped = {};
        
        transactions.forEach(t => {
            const entity = type === 'AR' ? t.customer : t.supplier;
            const entityId = entity?.id;
            
            if (!entityId) return; // Skip if no entity

            if (!grouped[entityId]) {
                grouped[entityId] = {
                    entityName: entity.name,
                    entityPhone: entity.phone,
                    totalPending: 0,
                    transactions: []
                };
            }

            const now = new Date();
            let daysOverdue = 0;
            if (t.dueDate && t.dueDate < now) {
                const diffTime = Math.abs(now - t.dueDate);
                daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            }

            grouped[entityId].totalPending += t.total;
            grouped[entityId].transactions.push({
                ...t,
                daysOverdue
            });
        });

        return Object.values(grouped);
    }
}

module.exports = new ReportService();
