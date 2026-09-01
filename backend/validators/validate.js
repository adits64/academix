import { validationResult } from "express-validator";
import { ValidationError } from "../errors/validation.js";


export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return  next(new ValidationError("Validation error", errors.array()));
    }
    next();
}