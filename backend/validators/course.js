import { body, param } from "express-validator";
import Course from "../models/course.js";
import { validate } from "./validate.js";
import { ValidationError } from "../errors/validation.js";
import User from "../models/user.js";


export const createCourseValidator = [

    body("name")
        .notEmpty()
        .withMessage("Course name is required")
        .trim()
        .escape()
        .isLength({ min: 2 })
        .withMessage("Course name must be at least 2 characters long"),

    body("code")
        .notEmpty()
        .withMessage("Course code is required")
        .trim()
        .toUpperCase()
        .escape()
        .custom(async (value) => {
            const course = await Course.findOne({ code: value });

            if (course) {
                throw new ValidationError("Course code already exists");
            }

            return true;
        }),

    body("description")
        .optional()
        .trim()
        .escape(),
    body("teacher")
        .notEmpty()
        .withMessage("Teacher ID is required")
        .isMongoId()
        .withMessage("Invalid teacher ID")
        .custom(async (value) => {
            const teacher = await User.findOne({
                _id: value,
                role: "teacher"
            });

            if (!teacher) {
                throw new ValidationError("Teacher not found");
            }

            return true;
        }),

    body("duration")
        .notEmpty()
        .withMessage("Course duration is required")
        .trim(),

    body("fee")
        .notEmpty()
        .withMessage("Course fee is required")
        .isFloat({ min: 0 })
        .withMessage("Course fee must be a positive number"),

    body("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Status must be active or inactive"),

    body("batches")
        .optional()
        .isArray()
        .withMessage("Batches must be an array"),

    body("batches.*.name")
        .notEmpty()
        .withMessage("Batch name is required")
        .trim()
        .escape(),

    body("batches.*.startDate")
        .notEmpty()
        .withMessage("Batch start date is required")
        .isISO8601()
        .withMessage("Invalid batch start date"),

    body("batches.*.endDate")
        .notEmpty()
        .withMessage("Batch end date is required")
        .isISO8601()
        .withMessage("Invalid batch end date"),

    body("batches.*.startTime")
        .notEmpty()
        .withMessage("Batch start time is required")
        .trim(),

    body("batches.*.endTime")
        .notEmpty()
        .withMessage("Batch end time is required")
        .trim(),

    validate,
];


export const updateCourseValidator = [

    body("name")
        .optional()
        .trim()
        .escape()
        .isLength({ min: 2 })
        .withMessage("Course name must be at least 2 characters long"),

    body("code")
        .optional()
        .trim()
        .toUpperCase()
        .escape()
        .custom(async (value, { req }) => {
            const course = await Course.findOne({
                code: value,
                _id: { $ne: req.params.id }
            });

            if (course) {
                throw new ValidationError("Course code already exists");
            }

            return true;
        }),

    body("description")
        .optional()
        .trim()
        .escape(),

    body("teacher")
        .optional()
        .isMongoId()
        .withMessage("Invalid teacher ID")
        .custom(async (value) => {
            const teacher = await User.findOne({
                _id: value,
                role: "teacher"
            });

            if (!teacher) {
                throw new ValidationError("Teacher not found");
            }

            return true;
        }),

    body("duration")
        .optional()
        .trim(),

    body("fee")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Course fee must be a positive number"),

    body("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Status must be active or inactive"),

    body("batches")
        .optional()
        .isArray()
        .withMessage("Batches must be an array"),

    body("batches.*.name")
        .optional()
        .trim()
        .escape(),

    body("batches.*.startDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid batch start date"),

    body("batches.*.endDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid batch end date"),

    body("batches.*.startTime")
        .optional()
        .trim(),

    body("batches.*.endTime")
        .optional()
        .trim(),

    validate,
];

export const courseIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid course ID"),
    validate,
];