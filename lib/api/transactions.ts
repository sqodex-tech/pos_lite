import api from '../axios';

export interface Transaction {
    _id: string;
    transactionNumber: string;
    partyId?: string;
    partyType?: 'CUSTOMER' | 'SUPPLIER';
    items: Array<{
        itemId: string;
        itemName?: string;
        quantity: number;
        price: number;
        discount?: number;
        total: number;
    }>;
    subtotal: number;
    tax: number;
    shipping?: number;
    total: number;
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT' | 'MIXED';
    paymentDetails?: {
        cash?: number;
        card?: number;
        bankTransfer?: number;
        credit?: number;
    };
    balanceTracking?: {
        previousBalance: number;
        transactionImpact: number;
        currentBalance: number;
        formattedPrevious: string;
        formattedImpact: string;
        formattedCurrent: string;
    };
    status: string;
    createdAt: string;
}

export const transactionsApi = {
    getAll: (storeId: string, params?: any) =>
        api.get('/transactions', { params: { ...params, storeId } }),
    
    getById: (id: string, storeId: string) =>
        api.get(`/transactions/${id}`, { params: { storeId } }),
    
    getDashboardSummary: (storeId: string) =>
        api.get('/transactions/dashboard-summary', { headers: { 'x-store-id': storeId } }),

    getPartyStatement: (partyId: string, storeId: string, params: { partyType: string; startDate: string; endDate: string }) =>
        api.get(`/transactions/statement/${partyId}`, { 
            params, 
            headers: { 'x-store-id': storeId } 
        }),

    create: (storeId: string, data: any) =>
        api.post('/transactions', data, { headers: { 'x-store-id': storeId } }),
    
    void: (id: string, storeId: string) =>
        api.delete(`/transactions/${id}`, { headers: { 'x-store-id': storeId } }),
};
