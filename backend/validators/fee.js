import { body, param } from "express-validator";
import User from "../models/user.js";
import Course from "../models/course.js";
import { ValidationError } from "../errors/validation.js";
import { validate } from "./validate.js";

export const createFeeValidator = [
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

    body("totalFee")
        .notEmpty()
        .withMessage("Total fee is required")
        .isFloat({ min: 0 })
        .withMessage("Total fee must be a positive number"),

    body("paidAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Paid amount must be a positive number"),

    body("dueAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Due amount must be a positive number"),

    body("status")
        .optional()
        .isIn(["paid", "partial", "unpaid"])
        .withMessage("Status must be paid, partial, or unpaid"),

    body("paymentDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid payment date"),

    validate
];

export const updateFeeValidator = [
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

            return true;
        }),

    body("totalFee")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Total fee must be a positive number"),

    body("paidAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Paid amount must be a positive number"),

    body("dueAmount")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Due amount must be a positive number"),

    body("status")
        .optional()
        .isIn(["paid", "partial", "unpaid"])
        .withMessage("Status must be paid, partial, or unpaid"),

    body("paymentDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid payment date"),

    validate
];

export const feeIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid fee ID"),

    validate
];

export const recordPaymentValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid fee ID"),

    body("amount")
        .notEmpty()
        .withMessage("Payment amount is required")
        .isFloat({ min: 0.01 })
        .withMessage("Payment amount must be greater than 0"),

    validate
];