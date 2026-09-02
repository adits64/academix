import { NotFoundError } from "../errors/not-found.js";
import Enrollment from "../models/enrollment.js";


export const create = async (data) => {
    const enrollment = await Enrollment.create(data);
    return enrollment;
};


export const getAll = async () => {
    const enrollments = await Enrollment.find()
        .populate("studentId", "name email avatar")
        .populate("courseId", "name code batches");

    return enrollments.map((enrollment) => {
        const data = enrollment.toObject();

        const batch = enrollment.courseId?.batches?.id(
            enrollment.batchId
        );

        delete data.batchId;

        return {
            ...data,
            batch
        };
    });
};


export const find = async (param, config) => {
    const enrollment = await Enrollment.findOne(param, config)
        .populate("studentId", "name email avatar")
        .populate("courseId", "name code batches");

    if (!enrollment) {
        throw new NotFoundError("Enrollment not found");
    }

    const data = enrollment.toObject();

    const batch = enrollment.courseId?.batches?.id(
        enrollment.batchId
    );

    delete data.batchId;

    return {
        ...data,
        batch
    };
};


export const update = async (id, data) => {
    const enrollment = await Enrollment.findByIdAndUpdate(
        id,
        data,
        { returnDocument: "after" }
    );

    if (!enrollment) {
        throw new NotFoundError("Enrollment not found");
    }

    return enrollment;
};


export const destroy = async (id) => {
    const enrollment = await Enrollment.findByIdAndDelete(id);

    if (!enrollment) {
        throw new NotFoundError("Enrollment not found");
    }

    return enrollment;
};

export const getMyEnrollments = async (studentId) => {
    const enrollments = await Enrollment.find({
        studentId,
    })
        .populate("studentId", "name email avatar")
        .populate({
            path: "courseId",
            populate: {
                path: "teacher",
                select: "name email avatar",
            },
        });

    return enrollments.map((enrollment) => {
        const data = enrollment.toObject();

        const batch = enrollment.courseId?.batches?.id(
            enrollment.batchId
        );

        delete data.batchId;

        return {
            ...data,
            batch
        };
    });
};