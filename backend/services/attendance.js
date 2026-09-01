import Attendance from "../models/attendance.js";
import Course from "../models/course.js";
import { NotFoundError } from "../errors/not-found.js";


// CREATE ATTENDANCE
export const create = async (data) => {
    const attendance = await Attendance.create(data);

    return attendance;
};


// GET ALL ATTENDANCE
// ADMIN ONLY
export const getAll = async () => {
    const attendances = await Attendance.find()
        .populate("studentId", "name email")
        .populate("courseId", "name code teacher")
        .populate("markedBy", "name email");

    return attendances;
};


// GET TEACHER'S ATTENDANCE
// Returns attendance from all courses taught by this teacher
export const getTeacherAttendance = async (teacherId) => {

    const courses = await Course.find({
        teacher: teacherId
    }).select("_id");

    const courseIds = courses.map(course => course._id);

    const attendances = await Attendance.find({
        courseId: { $in: courseIds }
    })
        .populate("studentId", "name email")
        .populate("courseId", "name code teacher")
        .populate("markedBy", "name email");

    return attendances;
};


// GET ATTENDANCE FOR ONE TEACHER'S COURSE + BATCH
// Used by teacher dashboard
export const getTeacherBatchAttendance = async (
    courseId,
    batchId,
    teacherId
) => {

    const course = await Course.findOne({
        _id: courseId,
        teacher: teacherId,
        "batches._id": batchId
    });

    if (!course) {
        throw new NotFoundError("Course or batch not found");
    }

    const attendances = await Attendance.find({
        courseId,
        batchId
    })
        .populate("studentId", "name email")
        .populate("courseId", "name code teacher")
        .populate("markedBy", "name email");

    return attendances;
};


// GET STUDENT'S OWN ATTENDANCE
// STUDENT ONLY
export const getMyAttendance = async (studentId) => {

    const attendances = await Attendance.find({
        studentId
    })
        .populate("courseId", "name code")
        .populate("markedBy", "name email");

    return attendances;
};


// FIND ONE ATTENDANCE
export const find = async (param, config, user) => {

    const attendance = await Attendance.findOne(
        param,
        config
    )
        .populate("studentId", "name email")
        .populate("courseId", "name code teacher")
        .populate("markedBy", "name email");

    if (!attendance) {
        throw new NotFoundError("Attendance not found");
    }


    // TEACHER
    // Can only see attendance from courses they teach
    if (user.role === "teacher") {

        if (
            String(attendance.courseId.teacher) !==
            String(user.userId)
        ) {
            throw new NotFoundError("Attendance not found");
        }
    }


    // STUDENT
    // Can only see their own attendance
    if (user.role === "student") {

        if (
            String(attendance.studentId._id) !==
            String(user.userId)
        ) {
            throw new NotFoundError("Attendance not found");
        }
    }


    // ADMIN
    // Can see any attendance

    return attendance;
};


// UPDATE ATTENDANCE
// TEACHER ONLY
export const update = async (id, data, user) => {

    const attendance = await Attendance.findById(id)
        .populate("courseId", "name code teacher");

    if (!attendance) {
        throw new NotFoundError("Attendance not found");
    }


    // Teacher can update only attendance
    // from courses they teach
    if (
        user.role === "teacher" &&
        String(attendance.courseId.teacher) !==
        String(user.userId)
    ) {
        throw new NotFoundError("Attendance not found");
    }


    // Only fields allowed by the validator
    // are updated.
    if (data.date !== undefined) {
        attendance.date = data.date;
    }

    if (data.status !== undefined) {
        attendance.status = data.status;
    }

    await attendance.save();


    // Populate the final response
    await attendance.populate("studentId", "name email");
    await attendance.populate("markedBy", "name email");

    return attendance;
};


// DELETE ATTENDANCE
// ADMIN ONLY
export const destroy = async (id) => {

    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
        throw new NotFoundError("Attendance not found");
    }

    return attendance;
};