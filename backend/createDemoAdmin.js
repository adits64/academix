import "dotenv/config";
import connectDB from "./config/database.js";
import User from "./models/user.js";

const createAdmin = async () => {
    try {
        await connectDB();

        const existingAdmin = await User.findOne({
            email: "demo@academix.com"
        });

        if (existingAdmin) {
            console.log("Demo admin already exists.");
            process.exit(0);
        }

        await User.create({
            name: "Demo Admin",
            email: "demo@academix.com",
            password: "D12345",
            role: "admin"
        });

        console.log("Demo admin created successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Failed to create demo admin:", error.message);
        process.exit(1);
    }
};

createAdmin();