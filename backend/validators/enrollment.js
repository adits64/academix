import { body } from "express-validator";
import User from "../models/user.js";
import Course from "../models/course.js";
import Enrollment from "../models/enrollment.js";
import { validate } from "./validate.js";
import { ValidationError } from "../errors/validation.js";

export const createEnrollmentValidator = [

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

            if (course.status !== "active") {
                throw new ValidationError("Cannot enroll in an inactive course");
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

    body("enrollmentDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid enrollment date"),

    body("status")
        .optional()
        .isIn(["active", "completed", "cancelled"])
        .withMessage("Invalid enrollment status"),

    body()
        .custom(async (value) => {
            const enrollment = await Enrollment.findOne({
                studentId: value.studentId,
                courseId: value.courseId,
                batchId: value.batchId
            });

            if (enrollment) {
                throw new ValidationError(
                    "Student is already enrolled in this batch"
                );
            }

            return true;
        }),

    validate,
];

export const updateEnrollmentValidator = [

    body("studentId")
        .optional()
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
        .optional()
        .isMongoId()
        .withMessage("Invalid course ID")
        .custom(async (value) => {
            const course = await Course.findById(value);

            if (!course) {
                throw new ValidationError("Course not found");
            }

            if (course.status !== "active") {
                throw new ValidationError(
                    "Cannot move enrollment to an inactive course"
                );
            }

            return true;
        }),

    body("batchId")
        .optional()
        .isMongoId()
        .withMessage("Invalid batch ID"),

    body("enrollmentDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid enrollment date"),

    body("status")
        .optional()
        .isIn(["active", "completed", "cancelled"])
        .withMessage("Invalid enrollment status"),

    body()
        .custom(async (value, { req }) => {

            const enrollment = await Enrollment.findById(req.params.id);

            if (!enrollment) {
                throw new ValidationError("Enrollment not found");
            }

            const studentId = value.studentId || enrollment.studentId;
            const courseId = value.courseId || enrollment.courseId;
            const batchId = value.batchId || enrollment.batchId;

            // Check batch belongs to the final course
            const course = await Course.findOne({
                _id: courseId,
                "batches._id": batchId
            });

            if (!course) {
                throw new ValidationError(
                    "Batch does not belong to the selected course"
                );
            }

            // Check duplicate enrollment
            const duplicate = await Enrollment.findOne({
                studentId,
                courseId,
                batchId,
                _id: { $ne: req.params.id }
            });

            if (duplicate) {
                throw new ValidationError(
                    "Student is already enrolled in this batch"
                );
            }

            return true;
        }),

    validate,
];