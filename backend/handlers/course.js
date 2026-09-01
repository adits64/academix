import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { 
    createCourseValidator, 
    updateCourseValidator, 
    courseIdValidator 
} from "../validators/course.js";

import {
     create,
    destroy, 
    find, 
    getAll, 
    getMyBatchStudents, 
    getMyCourses, 
    update
}  from "../services/course.js";


const COURSE_ROUTER = Router();
COURSE_ROUTER.use(authMiddleware);

COURSE_ROUTER.post(
    "/",
    authorize("admin"),
    createCourseValidator, 
    async(req , res , next)=>{
        try {
            const course = await create(req.body);
            res.status(201).json(course);
        } catch (error) {
            next(error);
        }
    }
)

COURSE_ROUTER.get(
    "/",
    authorize("admin", "teacher","student"),
    async(req, res, next)=>{
        try {
            const courses = await getAll();
            res.status(200).json({courses});
            
        } catch (error) {
            next(error);
        }

    }
)

COURSE_ROUTER.get(
    "/my",
    authorize("teacher"),
    async (req, res, next) => {
        try {
            const courses = await getMyCourses(req.user.userId);

            res.status(200).json(courses);
        } catch (error) {
            next(error);
        }
    }
);
COURSE_ROUTER.get(
    "/:id",
    authorize("admin","teacher", "student"),
    courseIdValidator,
    async(req,res, next)=>{
        try{
            const course = await find({_id:req.params.id});
            res.status(200).json({course});
        }catch(error){
            next(error)
        }
    }
);

COURSE_ROUTER.patch(
    "/:id",
    authorize("admin"),
    courseIdValidator,
    updateCourseValidator,
    async(req,res,next)=>{
        try {
            const course = await update(req.params.id, req.body);
            res.status(200).json({course})
        } catch (error) {
            next(error);
        }
    }
)

COURSE_ROUTER.delete(
    "/:id",
    authorize("admin"),
    courseIdValidator,
    async(req,res,next)=>{
        try {
            const course = await destroy(req.params.id)
            res.status(200).json({course});
        } catch (error) {
            next(error);
        }
    }
)

COURSE_ROUTER.get(
    "/:courseId/batches/:batchId/students",
    authorize("teacher"),
    async (req, res, next) => {
        try {
            const students = await getMyBatchStudents(
                req.params.courseId,
                req.params.batchId,
                req.user.userId
            );

            res.status(200).json(students);
        } catch (error) {
            next(error);
        }
    }
);

export default COURSE_ROUTER;