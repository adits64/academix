import { body } from "express-validator";
import { validate } from "./validate.js";


export const sendEmailValidator = [

    body("subject")
        .trim()
        .notEmpty()
        .withMessage("Subject is required")
        .isLength({ max: 200 })
        .withMessage("Subject must not exceed 200 characters"),


    body("message")
        .trim()
        .notEmpty()
        .withMessage("Message is required"),


    body("studentIds")
        .optional()
        .isArray({ min: 1 })
        .withMessage("Student IDs must be a non-empty array"),


    body("studentIds.*")
        .optional()
        .isMongoId()
        .withMessage("Invalid student ID"),


    body("courseId")
        .optional()
        .isMongoId()
        .withMessage("Invalid course ID"),


    body("batchId")
        .optional()
        .isMongoId()
        .withMessage("Invalid batch ID"),


    body()
        .custom((value) => {

            const hasStudents =
                Array.isArray(value.studentIds) &&
                value.studentIds.length > 0;

            const hasBatch =
                value.courseId &&
                value.batchId;

            if (!hasStudents && !hasBatch) {
                throw new Error(
                    "Provide studentIds or courseId and batchId"
                );
            }

            if (hasStudents && hasBatch) {
                throw new Error(
                    "Use either studentIds or courseId and batchId, not both"
                );
            }

            return true;
        }),


    validate
];