import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from potential locations
dotenv.config({ path: path.join(__dirname, '../../../.env') }); // Root .env
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Server .env

const fixProductIndexes = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('❌ MONGODB_URI is undefined. Check .env paths.');
            process.exit(1);
        }

        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection failed');
        }

        const collectionName = 'products';
        const collection = db.collection(collectionName);

        // Check if collection exists
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length === 0) {
            console.log(`Collection "${collectionName}" not found. No indexes to drop.`);
            await mongoose.disconnect();
            process.exit(0);
        }

        const indexes = await collection.indexes();
        console.log(`Indexes on "${collectionName}":`, indexes.map((i) => i.name));

        const problemIndexes = ['slug_1', 'discount_1'];

        for (const problemIndex of problemIndexes) {
            if (indexes.find((i) => i.name === problemIndex)) {
                console.log(`Found problematic index "${problemIndex}". Dropping...`);
                await collection.dropIndex(problemIndex);
                console.log(`✅ Dropped index: ${problemIndex}`);
            } else {
                console.log(`ℹ️ Index "${problemIndex}" not found.`);
            }
        }

        console.log('Closing connection...');
        await mongoose.disconnect();
        console.log('Done.');
        process.exit(0);

    } catch (error: unknown) {
        console.error('❌ Error in script:', error);
        process.exit(1);
    }
};

fixProductIndexes();
