import api from './api';

export interface Sale {
    _id: string;
    saleId: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    images: string[];
    category: string;
    sizes: string[];
    description: string;
    rating: number;
    reviews: number;
    stock: number;
    discount?: number;
    saleMode: string;
    cloudinaryId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SaleMode {
    _id: string;
    saleName: string;
    isActive: boolean;
    description?: string;
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
}

export const saleService = {
    // Sale Items
    getAllSales: async (): Promise<Sale[]> => {
        const response = await api.get('/sales/items');
        return response.data;
    },

    getActiveSales: async (): Promise<Sale[]> => {
        const response = await api.get('/sales/items/active');
        return response.data;
    },

    getSaleById: async (id: string): Promise<Sale> => {
        const response = await api.get(`/sales/items/${id}`);
        return response.data;
    },

    createSale: async (saleData: FormData): Promise<Sale> => {
        const response = await api.post('/sales/items', saleData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    updateSale: async (id: string, saleData: FormData | Partial<Sale>): Promise<Sale> => {
        const response = await api.put(`/sales/items/${id}`, saleData, {
            headers: saleData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
        });
        return response.data;
    },

    deleteSale: async (id: string): Promise<void> => {
        await api.delete(`/sales/items/${id}`);
    },

    // Sale Modes
    getAllSaleModes: async (): Promise<SaleMode[]> => {
        const response = await api.get('/sales/modes');
        return response.data;
    },

    getActiveSaleMode: async (): Promise<SaleMode | null> => {
        const response = await api.get('/sales/modes/active');
        return response.data;
    },

    createOrUpdateSaleMode: async (saleMode: Partial<SaleMode>): Promise<SaleMode> => {
        const response = await api.post('/sales/modes', saleMode);
        return response.data;
    },

    toggleSaleMode: async (saleName: string): Promise<SaleMode> => {
        const response = await api.put(`/sales/modes/${saleName}/toggle`);
        return response.data;
    },

    deleteSaleMode: async (saleName: string): Promise<void> => {
        await api.delete(`/sales/modes/${saleName}`);
    },
};
