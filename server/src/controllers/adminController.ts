import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import User from '../models/User';
import Product from '../models/Product';
import { writeAudit } from '../utils/auditLog';
import { sendOrderStatusUpdateEmail } from '../config/email';
import { uploadToCloudinary } from '../config/cloudinary';
import { validateImageBuffer } from '../utils/itemHelpers';

const ORDER_TRANSITIONS: Record<string, string[]> = {
    pending: ['confirmed', 'processing', 'cancelled', 'returned'],
    confirmed: ['processing', 'cancelled', 'returned'],
    processing: ['shipped', 'cancelled', 'returned'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned'],
    cancelled: [],
    returned: [],
};

export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const [totalUsers, totalOrders, revenueResult, cancelledResult, returnedResult, recentOrders, lowStockProducts, pendingOrders, totalProducts] =
            await Promise.all([
                User.countDocuments(),
                Order.countDocuments(),
                Order.aggregate([
                    {
                        $match: {
                            $or: [{ paymentStatus: 'paid' }, { orderStatus: 'delivered' }],
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$total' },
                        },
                    },
                ]),
                Order.aggregate([
                    { $match: { orderStatus: 'cancelled' } },
                    {
                        $group: {
                            _id: null,
                            totalCancelledAmount: { $sum: '$total' },
                        },
                    },
                ]),
                Order.aggregate([
                    { $match: { orderStatus: 'returned' } },
                    {
                        $group: {
                            _id: null,
                            totalReturnedAmount: { $sum: '$total' },
                        },
                    },
                ]),
                Order.find().sort({ createdAt: -1 }).limit(5).lean(),
                Product.countDocuments({ stock: { $lte: 10 } }),
                Order.countDocuments({ orderStatus: { $in: ['pending', 'confirmed', 'processing'] } }),
                Product.countDocuments(),
            ]);

        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
        const totalCancelledAmount = cancelledResult.length > 0 ? cancelledResult[0].totalCancelledAmount : 0;
        const totalReturnedAmount = returnedResult.length > 0 ? returnedResult[0].totalReturnedAmount : 0;

        res.json({
            totalUsers,
            totalOrders,
            totalRevenue,
            totalCancelledAmount,
            totalReturnedAmount,
            recentOrders,
            lowStockProducts,
            pendingOrders,
            totalProducts,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query: Record<string, unknown> = {};
        if (status && status !== 'all') query.orderStatus = status;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Order.countDocuments(query),
        ]);

        res.json({
            orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const orderId = String(req.params.orderId);
        const { status } = req.body;

        if (!status || typeof status !== 'string') {
            res.status(400).json({ error: 'status is required' });
            return;
        }

        const order = await Order.findOne({ orderId });
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        const current = order.orderStatus;
        const allowed = ORDER_TRANSITIONS[current] || [];
        if (!allowed.includes(status)) {
            res.status(400).json({
                error: `Invalid transition: ${current} → ${status}`,
                allowed,
            });
            return;
        }

        order.orderStatus = status as typeof order.orderStatus;
        if (status === 'delivered' && order.paymentMethod === 'cod') {
            order.paymentStatus = 'paid';
        }
        if (status === 'returned') {
            order.returnedAt = new Date();
        }
        await order.save();

        try {
            await sendOrderStatusUpdateEmail({
                customerName: order.shippingAddress.fullName,
                customerEmail: order.shippingAddress.email || order.userEmail,
                orderId: order.orderId,
                orderStatus: order.orderStatus,
                estimatedDelivery: order.estimatedDelivery,
                trackingNumber: order.trackingNumber,
            });
        } catch (emailErr) {
            console.error('Failed to send status update email:', emailErr);
        }

        await writeAudit(req.user!.uid, req.user!.email, 'order_status_update', 'order', orderId, {
            from: current,
            to: status,
        });

        res.json(order);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }

        const buf = req.file.buffer;
        if (!validateImageBuffer(buf)) {
            res.status(400).json({ error: 'Invalid image file format. Supported: JPEG, PNG, WEBP, GIF, BMP' });
            return;
        }

        const category = typeof req.body.category === 'string' ? req.body.category : 'admin_uploads';
        const uploaded = await uploadToCloudinary(buf, category);

        res.json({
            url: uploaded.url,
            publicId: uploaded.publicId,
        });
    } catch (error) {
        console.error('Image upload endpoint error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};
