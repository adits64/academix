import { Router } from "express";
import USER_ROUTER from "./user.js"
import AUTH_ROUTER from "./auth.js";
import COURSE_ROUTER from "./course.js";
import ATTENDANCE_ROUTER from "./attandance.js";
import NOTE_ROUTER from "./notes.js";
import EMAIL_ROUTER from "./mail.js";
import ENROLLMENT_ROUTER from "./enrollment.js";


const HANDLERS = Router();

HANDLERS.get("/", async(req , res)=> {
    res.json({message:'welcome to the student management system'});
});

HANDLERS.use('/users', USER_ROUTER);
HANDLERS.use('/auth', AUTH_ROUTER)
HANDLERS.use('/courses', COURSE_ROUTER);
HANDLERS.use('/enrollments', ENROLLMENT_ROUTER);
HANDLERS.use('/attandances', ATTENDANCE_ROUTER);
HANDLERS.use('/notes', NOTE_ROUTER);
HANDLERS.use("/email", EMAIL_ROUTER);




export default HANDLERS;