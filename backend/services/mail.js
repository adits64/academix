import User from "../models/user.js";
import Course from "../models/course.js";
import Enrollment from "../models/enrollment.js";

import { NotFoundError } from "../errors/not-found.js";
import { ValidationError } from "../errors/validation.js";



import { sendEmail } from "../utils/mail.js";















export const sendNotice = async (data, user) => {

    let students = [];


    
    
    

    if (data.studentIds) {

        students = await User.find({
            _id: { $in: data.studentIds },
            role: "student",
        }).select("_id name email");


        if (students.length === 0) {
            throw new NotFoundError(
                "No valid students found"
            );
        }


        
        if (students.length !== data.studentIds.length) {
            throw new NotFoundError(
                "One or more students were not found"
            );
        }


        
        
        

        if (user.role === "teacher") {

            const enrollments = await Enrollment.find({
                studentId: { $in: data.studentIds },
                status: "active",
            }).select("studentId courseId batchId");


            if (enrollments.length === 0) {
                throw new NotFoundError(
                    "These students are not enrolled in your course"
                );
            }


            const courseIds = [
                ...new Set(
                    enrollments.map(
                        enrollment =>
                            String(enrollment.courseId)
                    )
                )
            ];


            const teacherCourses = await Course.find({
                _id: { $in: courseIds },
                teacher: user.userId,
            }).select("_id");


            const teacherCourseIds = new Set(
                teacherCourses.map(course =>
                    String(course._id)
                )
            );


            const authorizedStudentIds = new Set(
                enrollments
                    .filter(enrollment =>
                        teacherCourseIds.has(
                            String(enrollment.courseId)
                        )
                    )
                    .map(enrollment =>
                        String(enrollment.studentId)
                    )
            );


            const unauthorizedStudents =
                data.studentIds.filter(
                    studentId =>
                        !authorizedStudentIds.has(
                            String(studentId)
                        )
                );


            if (unauthorizedStudents.length > 0) {
                throw new ValidationError(
                    "You can only send emails to students enrolled in your courses"
                );
            }
        }
    }


    
    
    

    if (data.courseId && data.batchId) {

        const course = await Course.findById(
            data.courseId
        );


        if (!course) {
            throw new NotFoundError(
                "Course not found"
            );
        }


        
        const batch = course.batches.id(
            data.batchId
        );


        if (!batch) {
            throw new NotFoundError(
                "Batch does not belong to this course"
            );
        }


        
        
        

        if (user.role === "teacher") {

            if (
                String(course.teacher) !==
                String(user.userId)
            ) {
                throw new ValidationError(
                    "You are not authorized to send email for this course"
                );
            }
        }


        
        
        

        const enrollments = await Enrollment.find({
            courseId: data.courseId,
            batchId: data.batchId,
            status: "active",
        }).select("studentId");


        if (enrollments.length === 0) {
            throw new NotFoundError(
                "No students are enrolled in this batch"
            );
        }


        const studentIds = enrollments.map(
            enrollment => enrollment.studentId
        );


        students = await User.find({
            _id: { $in: studentIds },
            role: "student",
        }).select("_id name email");


        if (students.length === 0) {
            throw new NotFoundError(
                "No students found in this batch"
            );
        }
    }


    
    
    

    const recipients = [
        ...new Set(
            students
                .map(student => student.email)
                .filter(Boolean)
        )
    ];


    if (recipients.length === 0) {
        throw new NotFoundError(
            "No student email addresses found"
        );
    }


    
    
    

    const result = await sendEmail({
        bcc: recipients,
        subject: data.subject,
        text: data.message,
    });


    return {
        message: "Email sent successfully",
        recipientCount: recipients.length,
        messageId: result.messageId,
    };
};