import { NotFoundError } from "../errors/not-found.js";
import Course from "../models/course.js";
import Enrollment from "../models/enrollment.js";

export const create = async(data) =>{
    const course = await Course.create(data);
    return course;
}

export const getAll = async()=>{
    const courses = await Course.find();
    return courses;
}

export const find = async(param, config)=>{
    const course = await Course.findOne(param , config);
    if(!course){
        throw new NotFoundError("Course Not Found");
    };
    return course;
}

export const update = async(id , data)=>{
    const course = await Course.findByIdAndUpdate(
        id,
        data,
        {returnDocument : "after"}
    );
    if(!course){
        throw new NotFoundError("Course Not found");
    };
    return course;
}

export const destroy = async(id)=>{
    const course = await Course.findByIdAndDelete(id);
    if(!course){
        throw new NotFoundError("Course not found");
    };
    return course;
}
export const getMyCourses = async (teacherId) => {
    const courses = await Course.find({
        teacher: teacherId
    });

    return courses;
};
export const getMyBatchStudents = async (
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

    const enrollments = await Enrollment.find({
        courseId,
        batchId,
        status: "active"
    })
        .populate("studentId", "name email phone avatar");

    return enrollments;
};
