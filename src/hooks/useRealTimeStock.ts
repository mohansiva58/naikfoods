import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from '@tanstack/react-query';

interface StockUpdate {
    productId: string;
    size: string;
    stock: number;
    totalStock?: number;
    reservedStock?: number;
}

function applyStockUpdate(product: Record<string, unknown>, data: StockUpdate) {
    const sizeCounts = { ...((product.sizeCounts as Record<string, number>) || {}) };
    const sizeReservedCounts = { ...((product.sizeReservedCounts as Record<string, number>) || {}) };

    const existingTotal = Number(sizeCounts[data.size] || 0);
    const totalStock = data.totalStock ?? existingTotal;
    const reservedStock =
        data.reservedStock ??
        (data.totalStock !== undefined
            ? Math.max(0, data.totalStock - data.stock)
            : Math.max(0, existingTotal - data.stock));

    sizeCounts[data.size] = totalStock;
    sizeReservedCounts[data.size] = reservedStock;

    const availableTotal = Object.keys(sizeCounts).reduce((acc, size) => {
        const total = Number(sizeCounts[size] || 0);
        const reserved = Number(sizeReservedCounts[size] || 0);
        return acc + Math.max(0, total - reserved);
    }, 0);

    return {
        ...product,
        sizeCounts,
        sizeReservedCounts,
        stock: availableTotal,
    };
}

export const useRealTimeStock = (productId?: string) => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        socket.on('stockUpdate', (data: StockUpdate) => {
            queryClient.setQueryData(['product', data.productId], (oldData: unknown) => {
                if (!oldData) return oldData;
                return applyStockUpdate(oldData as Record<string, unknown>, data);
            });

            queryClient.setQueriesData({ queryKey: ['products'] }, (oldData: unknown) => {
                if (!oldData) return oldData;

                if (Array.isArray(oldData)) {
                    return oldData.map((product: Record<string, unknown>) => {
                        const pid = (product.productId || product._id || product.id) as string;
                        return pid === data.productId ? applyStockUpdate(product, data) : product;
                    });
                }

                if (
                    oldData &&
                    typeof oldData === 'object' &&
                    'items' in oldData &&
                    Array.isArray((oldData as { items: unknown[] }).items)
                ) {
                    const paged = oldData as { items: Record<string, unknown>[] };
                    return {
                        ...paged,
                        items: paged.items.map((product) => {
                            const pid = (product.productId || product._id || product.id) as string;
                            return pid === data.productId ? applyStockUpdate(product, data) : product;
                        }),
                    };
                }

                return oldData;
            });
        });

        return () => {
            socket.off('stockUpdate');
        };
    }, [socket, queryClient]);
};
