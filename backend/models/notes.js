import { Schema, model } from "mongoose";

const noteSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        fileUrl: {
            type: String,
            required: true,
            trim: true,
        },

        fileName: {
            type: String,
            required: true,
            trim: true,
        },

        fileType: {
            type: String,
            required: true,
            trim: true,
        },

        teacherId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        batchId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Note = model("Note", noteSchema);

export default Note;