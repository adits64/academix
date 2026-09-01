import { Schema, model } from "mongoose";

const batchSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
        },

        startTime: {
            type: String,
            required: true,
        },

        endTime: {
            type: String,
            required: true,
        },
    },
    { _id: true }
);

const courseSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },

        description: {
            type: String,
            trim: true,
        },
        teacher: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        duration: {
            type: String,
            required: true,
            trim: true,
        },

        fee: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },

        batches: [batchSchema],
    },

    { timestamps: true }
);

const Course = model("Course", courseSchema);

export default Course;