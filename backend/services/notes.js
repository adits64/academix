import Note from "../models/notes.js";
import User from "../models/user.js";
import Course from "../models/course.js";
import Enrollment from "../models/enrollment.js";
import { NotFoundError } from "../errors/not-found.js";








export const create = async (data, teacherId) => {

    const course = await Course.findOne({
        _id: data.courseId,
        teacher: teacherId,
    });

    if (!course) {
        throw new NotFoundError(
            "Course not found or you are not the teacher of this course"
        );
    }

    const batch = course.batches.id(data.batchId);

    if (!batch) {
        throw new NotFoundError(
            "Batch does not belong to this course"
        );
    }

    const note = await Note.create({
        ...data,
        teacherId,
    });

    return note;
};







export const getAll = async () => {

    const notes = await Note.find()
        .populate("teacherId", "name email")
        .populate("courseId", "name code");

    return notes;
};







export const getTeacherNotes = async (teacherId) => {

    const notes = await Note.find({
        teacherId,
    })
        .populate("courseId", "name code");

    return notes;
};







export const getMyNotes = async (studentId) => {

    const enrollments = await Enrollment.find({
        studentId,
        status: "active",
    }).select("courseId batchId");

    if (enrollments.length === 0) {
        return [];
    }

    const notes = await Note.find({
        $or: enrollments.map((enrollment) => ({
            courseId: enrollment.courseId,
            batchId: enrollment.batchId,
        })),
    })
        .populate("teacherId", "name email")
        .populate("courseId", "name code");

    return notes;
};









export const find = async (id, user) => {

    const note = await Note.findById(id)
        .populate("teacherId", "name email")
        .populate("courseId", "name code");

    if (!note) {
        throw new NotFoundError("Note not found");
    }


    
    if (user.role === "admin") {
        return note;
    }


    
    if (user.role === "teacher") {
        const ownerId = note.teacherId?._id ? String(note.teacherId._id) : String(note.teacherId);
        if (ownerId !== String(user.userId)) {
            throw new NotFoundError("Note not found");
        }

        return note;
    }


    
    if (user.role === "student") {
        const courseId = note.courseId?._id ? note.courseId._id : note.courseId;
        const enrollment = await Enrollment.findOne({
            studentId: user.userId,
            courseId: courseId,
            batchId: note.batchId,
            status: "active",
        });

        if (!enrollment) {
            
            const courseEnrollment = await Enrollment.findOne({
                studentId: user.userId,
                courseId: courseId,
                status: "active",
            });
            if (!courseEnrollment) {
                throw new NotFoundError("Note not found");
            }
        }

        return note;
    }


    throw new NotFoundError("Note not found");
};








export const update = async (id, data, teacherId) => {

    const note = await Note.findOne({
        _id: id,
        teacherId,
    });

    if (!note) {
        throw new NotFoundError("Note not found");
    }


    if (data.title !== undefined) {
        note.title = data.title;
    }

    if (data.description !== undefined) {
        note.description = data.description;
    }

    if (data.fileUrl !== undefined) {
        note.fileUrl = data.fileUrl;
    }

    if (data.fileName !== undefined) {
        note.fileName = data.fileName;
    }

    if (data.fileType !== undefined) {
        note.fileType = data.fileType;
    }


    await note.save();


    await note.populate("teacherId", "name email");
    await note.populate("courseId", "name code");

    return note;
};








export const destroy = async (id, user) => {

    const filter = {
        _id: id,
    };

    if (user.role === "teacher") {
        filter.teacherId = user.userId;
    }

    const note = await Note.findOneAndDelete(filter);

    if (!note) {
        throw new NotFoundError("Note not found");
    }

    return note;
};