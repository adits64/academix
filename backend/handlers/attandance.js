import { Router } from "express";

import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";





import {createAttendanceValidator, updateAttendanceValidator} from "../validators/attendence.js"

import {
    create,
    getAll,
    getTeacherAttendance,
    getTeacherBatchAttendance,
    getMyAttendance,
    find,
    update,
    destroy
} from "../services/attendance.js";


const ATTENDANCE_ROUTER = Router();



ATTENDANCE_ROUTER.use(authMiddleware);






ATTENDANCE_ROUTER.post(
    "/",
    authorize("teacher"),
    createAttendanceValidator,
    async (req, res, next) => {

        try {

            const attendance = await create({
                ...req.body,
                markedBy: req.user.userId
            });

            res.status(201).json(attendance);

        } catch (error) {
            next(error);
        }
    }
);






ATTENDANCE_ROUTER.get(
    "/",
    authorize("admin"),
    async (req, res, next) => {

        try {

            const attendances = await getAll();

            res.status(200).json(attendances);

        } catch (error) {
            next(error);
        }
    }
);






ATTENDANCE_ROUTER.get(
    "/teacher",
    authorize("teacher"),
    async (req, res, next) => {

        try {

            const attendances = await getTeacherAttendance(
                req.user.userId
            );

            res.status(200).json(attendances);

        } catch (error) {
            next(error);
        }
    }
);






ATTENDANCE_ROUTER.get(
    "/teacher/:courseId/:batchId",
    authorize("teacher"),
    async (req, res, next) => {

        try {

            const attendances = await getTeacherBatchAttendance(
                req.params.courseId,
                req.params.batchId,
                req.user.userId
            );

            res.status(200).json(attendances);

        } catch (error) {
            next(error);
        }
    }
);






ATTENDANCE_ROUTER.get(
    "/my",
    authorize("student"),
    async (req, res, next) => {

        try {

            const attendances = await getMyAttendance(
                req.user.userId
            );

            res.status(200).json(attendances);

        } catch (error) {
            next(error);
        }
    }
);








ATTENDANCE_ROUTER.get(
    "/:id",
    authorize("admin", "teacher", "student"),
    async (req, res, next) => {

        try {

            const attendance = await find(
                {
                    _id: req.params.id
                },
                null,
                req.user
            );

            res.status(200).json(attendance);

        } catch (error) {
            next(error);
        }
    }
);






ATTENDANCE_ROUTER.patch(
    "/:id",
    authorize("teacher"),
    updateAttendanceValidator,
    async (req, res, next) => {

        try {

            const attendance = await update(
                req.params.id,
                req.body,
                req.user
            );

            res.status(200).json(attendance);

        } catch (error) {
            next(error);
        }
    }
);






ATTENDANCE_ROUTER.delete(
    "/:id",
    authorize("admin"),
    async (req, res, next) => {

        try {

            const attendance = await destroy(
                req.params.id
            );

            res.status(200).json(attendance);

        } catch (error) {
            next(error);
        }
    }
);


export default ATTENDANCE_ROUTER;