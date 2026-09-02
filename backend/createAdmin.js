import "dotenv/config";
import connectDB from "./config/database.js";
import User from "./models/user.js";

const createAdmin = async () => {
    try {
        await connectDB();

        const existingAdmin = await User.findOne({
            email: "admin@gmail.com"
        });

        if (existingAdmin) {
            console.log("Admin already exists.");
            process.exit(0);
        }

        await User.create({
            name: "Demo Admin",
            email: "demo@academix.com",
            password: "D12345",
            role: "admin"
        });

        console.log("Admin created successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Failed to create admin:", error.message);
        process.exit(1);
    }
};

createAdmin();