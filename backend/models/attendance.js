import { Schema, model } from "mongoose";

const attendanceSchema = new Schema(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true
        },

        batchId: {
            type: Schema.Types.ObjectId,
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["present", "absent", "late"],
            required: true
        },

        markedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

const Attendance = model("Attendance", attendanceSchema);

export default Attendance;