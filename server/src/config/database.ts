import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(mongoUri, {
            // Connection pool: handles 100+ concurrent users
            maxPoolSize: 50,       // Max connections in pool (default was 5!)
            minPoolSize: 10,       // Keep at least 10 ready connections
            maxIdleTimeMS: 30000,  // Close idle connections after 30s
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            // Buffering: queue operations when disconnected temporarily
            bufferCommands: true,
            // Auto-create indexes in production (set false if using migrations)
            autoIndex: process.env.NODE_ENV !== 'production',
        });

        console.log('✅ MongoDB connected successfully');
        console.log(`   Pool size: 10-50 connections`);

        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });

    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    await mongoose.connection.close();
    console.log('✅ MongoDB disconnected gracefully');
};

export default mongoose;
