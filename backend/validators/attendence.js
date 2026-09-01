import { body } from "express-validator";

import User from "../models/user.js";
import Course from "../models/course.js";
import Enrollment from "../models/enrollment.js";
import Attendance from "../models/attendance.js";

import { ValidationError } from "../errors/validation.js";
import { validate } from "./validate.js";


export const createAttendanceValidator = [

    body("studentId")
        .notEmpty()
        .withMessage("Student ID is required")
        .isMongoId()
        .withMessage("Invalid student ID")
        .custom(async (value) => {

            const student = await User.findOne({
                _id: value,
                role: "student"
            });

            if (!student) {
                throw new ValidationError("Student not found");
            }

            return true;
        }),


    body("courseId")
        .notEmpty()
        .withMessage("Course ID is required")
        .isMongoId()
        .withMessage("Invalid course ID")
        .custom(async (value) => {

            const course = await Course.findById(value);

            if (!course) {
                throw new ValidationError("Course not found");
            }

            return true;
        }),


    body("batchId")
        .notEmpty()
        .withMessage("Batch ID is required")
        .isMongoId()
        .withMessage("Invalid batch ID")
        .custom(async (value, { req }) => {

            const course = await Course.findOne({
                _id: req.body.courseId,
                "batches._id": value
            });

            if (!course) {
                throw new ValidationError(
                    "Batch does not belong to the selected course"
                );
            }

            return true;
        }),


    body("date")
        .notEmpty()
        .withMessage("Attendance date is required")
        .isISO8601()
        .withMessage("Invalid attendance date"),


    body("status")
        .notEmpty()
        .withMessage("Attendance status is required")
        .isIn(["present", "absent", "late"])
        .withMessage("Invalid attendance status"),


    body()
        .custom(async (value, { req }) => {

            // Teacher must teach this course
            const course = await Course.findOne({
                _id: value.courseId,
                teacher: req.user.userId
            });

            if (!course) {
                throw new ValidationError(
                    "You are not authorized to mark attendance for this course"
                );
            }


            // Student must be enrolled in this course + batch
            const enrollment = await Enrollment.findOne({
                studentId: value.studentId,
                courseId: value.courseId,
                batchId: value.batchId,
                status: "active"
            });

            if (!enrollment) {
                throw new ValidationError(
                    "Student is not enrolled in this course batch"
                );
            }


            // Prevent duplicate attendance
            const duplicate = await Attendance.findOne({
                studentId: value.studentId,
                courseId: value.courseId,
                batchId: value.batchId,
                date: value.date
            });

            if (duplicate) {
                throw new ValidationError(
                    "Attendance already marked for this student on this date"
                );
            }

            return true;
        }),


    validate
];


export const updateAttendanceValidator = [

    body("date")
        .optional()
        .isISO8601()
        .withMessage("Invalid attendance date"),


    body("status")
        .optional()
        .isIn(["present", "absent", "late"])
        .withMessage("Invalid attendance status"),


    body()
        .custom(async (value, { req }) => {

            const attendance = await Attendance.findById(
                req.params.id
            );

            if (!attendance) {
                throw new ValidationError(
                    "Attendance not found"
                );
            }


            // Teacher must teach the attendance's course
            const course = await Course.findOne({
                _id: attendance.courseId,
                teacher: req.user.userId
            });

            if (!course) {
                throw new ValidationError(
                    "You are not authorized to update this attendance"
                );
            }


            // If date is being changed,
            // prevent duplicate attendance
            if (value.date) {

                const duplicate = await Attendance.findOne({
                    studentId: attendance.studentId,
                    courseId: attendance.courseId,
                    batchId: attendance.batchId,
                    date: value.date,
                    _id: {
                        $ne: attendance._id
                    }
                });

                if (duplicate) {
                    throw new ValidationError(
                        "Attendance already exists for this student on this date"
                    );
                }
            }

            return true;
        }),


    validate
];