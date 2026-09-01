import { body } from "express-validator";
import User from '../models/user.js';
import { ValidationError } from "../errors/validation.js";
import { validate } from "./validate.js";

export const createUserValidator = [
    body("name")
        .notEmpty()
        .withMessage("Name is required")
        .trim()
        .escape()
        .isLength({min:2})
        .withMessage("must be altleast two character long")
        .isAlpha("en-US",{ignore:" "})
        .withMessage("Name must be in alphabet"),
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Enter a valid email")
        .trim()
        .toLowerCase()
        .escape()
        . custom(async(value) =>{
                const user = await User.findOne({email:value});
                if(user){
                    throw new ValidationError("This email is already registered");
                }
            }),
    body("password")
        .notEmpty()
        .withMessage("Please enter password")
        .isLength({min:6})
        .withMessage("password must contain six character"),
    body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["admin","teacher", "student"])
    .withMessage("Role must be one of: admin, teacher, or student."),
    validate,
]


export const updateUserValidator = [
    body("name")
        .optional()
        .trim()
        .escape()
        .isLength({min:2})
        .withMessage("must be altleast two character long")
        .isAlpha("en-US",{ignore:" "})
        .withMessage("Name must be in alphabet"),
    body("email")
    .optional()
    .isEmail()
    .withMessage("Enter a valid email")
    .trim()
    .toLowerCase()
    .custom(async (value, { req }) => {

        const user = await User.findOne({
            email: value,
            _id: { $ne: req.params.id }
        });

        if (user) {
            throw new ValidationError(
                "This email is already registered"
            );
        }

        return true;
    }),
    body("password")
        .optional()
        .isLength({min:6})
        .withMessage("password must contain six character"),
    body("currentPassword")
        .optional()
        .trim(),
    body("role")
        .optional()
        .isIn(["admin", "teacher", "student"])
        .withMessage("Role must be one of: admin, teacher, or student."),
    body("avatar")
        .optional()
        .trim(),
    validate,
]

export const loginValidator = [
    body("email")
    .notEmpty()
    .withMessage("Email is Require")
    .isEmail()
    .withMessage("Invalid email format")
    .trim()
    .escape(),
body("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({min: 6})
    .withMessage("password must be atleast 6 charecter"),
    validate,
]