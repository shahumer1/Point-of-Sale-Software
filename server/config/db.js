const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Detect if the connected server is a replica set (required for transactions)
        try {
            const admin = conn.connection.db.admin();
            const info = await admin.command({ hello: 1 });
            const isReplicaSet = !!(info && (info.setName || info.isreplicaset));
            // Expose a flag on mongoose for other modules to check
            mongoose.transactionsSupported = isReplicaSet;
            console.log('MongoDB transactions supported:', mongoose.transactionsSupported);
        } catch (innerErr) {
            // If detection fails, be conservative and disable transaction usage
            mongoose.transactionsSupported = false;
            console.warn('Could not detect replica set info, disabling transactions.');
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
