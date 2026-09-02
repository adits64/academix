import { Router } from "express";

import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

import {
    sendEmailValidator
} from "../validators/mail.js";

import {
    sendNotice
} from "../services/mail.js";


const EMAIL_ROUTER = Router();



EMAIL_ROUTER.use(authMiddleware);









EMAIL_ROUTER.post(
    "/",
    authorize("admin", "teacher"),
    sendEmailValidator,
    async (req, res, next) => {

        try {

            const result = await sendNotice(
                req.body,
                req.user
            );

            res.status(200).json(result);

        } catch (error) {
            next(error);
        }
    }
);


export default EMAIL_ROUTER;