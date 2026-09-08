import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from potential locations
dotenv.config({ path: path.join(__dirname, '../../../.env') }); // Root .env
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Server .env

const fixIndexes = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('❌ MONGODB_URI is undefined. Check .env paths.');
            process.exit(1);
        }

        console.log(`Connecting to MongoDB...`);
        // using 127.0.0.1 instead of localhost sometimes helps node
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection failed');
        }

        // List collections to be sure
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const collectionName = 'orders';
        if (!collections.find(c => c.name === collectionName)) {
            console.log(`Collection "${collectionName}" not found.`);
            process.exit(0);
        }

        const collection = db.collection(collectionName);
        const indexes = await collection.indexes();
        console.log('Indexes on "orders":', indexes.map((i) => i.name));

        const problemIndex = 'orderNumber_1';
        if (indexes.find((i) => i.name === problemIndex)) {
            console.log(`Found problematic index "${problemIndex}". Dropping...`);
            await collection.dropIndex(problemIndex);
            console.log(`✅ Dropped index: ${problemIndex}`);
        } else {
            console.log(`ℹ️ Index "${problemIndex}" not found. No action needed.`);
        }

        console.log('Closing connection...');
        await mongoose.disconnect();
        console.log('Bye.');
        process.exit(0);

    } catch (error: unknown) {
        console.error('❌ Error in script:', error);
        process.exit(1);
    }
};

fixIndexes();
