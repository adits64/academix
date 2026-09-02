import { body } from "express-validator";

import Course from "../models/course.js";
import Note from "../models/notes.js";

import { ValidationError } from "../errors/validation.js";
import { validate } from "./validate.js";






export const createNoteValidator = [

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required")
        .isLength({ max: 150 })
        .withMessage("Title must not exceed 150 characters"),


    body("description")
        .optional()
        .trim(),


    body("fileUrl")
        .trim()
        .notEmpty()
        .withMessage("File URL is required"),


    body("fileName")
        .trim()
        .notEmpty()
        .withMessage("File name is required"),


    body("fileType")
        .trim()
        .notEmpty()
        .withMessage("File type is required"),


    body("courseId")
        .notEmpty()
        .withMessage("Course ID is required")
        .isMongoId()
        .withMessage("Invalid course ID"),


    body("batchId")
        .notEmpty()
        .withMessage("Batch ID is required")
        .isMongoId()
        .withMessage("Invalid batch ID"),


    
    
    

    body()
        .custom(async (value, { req }) => {

            const course = await Course.findOne({
                _id: value.courseId,
                teacher: req.user.userId
            });

            if (!course) {
                throw new ValidationError(
                    "You are not authorized to add notes to this course"
                );
            }


            
            const batch = course.batches.id(
                value.batchId
            );

            if (!batch) {
                throw new ValidationError(
                    "Batch does not belong to this course"
                );
            }

            return true;
        }),


    validate
];






export const updateNoteValidator = [

    body("title")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Title cannot be empty")
        .isLength({ max: 150 })
        .withMessage("Title must not exceed 150 characters"),


    body("description")
        .optional()
        .trim(),


    body("fileUrl")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("File URL cannot be empty"),


    body("fileName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("File name cannot be empty"),


    body("fileType")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("File type cannot be empty"),


    
    body("courseId")
        .not()
        .exists()
        .withMessage("Course cannot be changed"),


    body("batchId")
        .not()
        .exists()
        .withMessage("Batch cannot be changed"),


    body("teacherId")
        .not()
        .exists()
        .withMessage("Teacher cannot be changed"),


    
    
    

    body()
        .custom(async (value, { req }) => {

            const note = await Note.findById(
                req.params.id
            );

            if (!note) {
                throw new ValidationError(
                    "Note not found"
                );
            }


            if (
                String(note.teacherId) !==
                String(req.user.userId)
            ) {
                throw new ValidationError(
                    "You are not authorized to update this note"
                );
            }

            return true;
        }),


    validate
];