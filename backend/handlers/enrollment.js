import { Router } from "express";

import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

import {
    createEnrollmentValidator,
    updateEnrollmentValidator
} from "../validators/enrollment.js";

import {
    create,
    getAll,
    getMyEnrollments,
    find,
    update,
    destroy
} from "../services/enrollment.js";


const ENROLLMENT_ROUTER = Router();

ENROLLMENT_ROUTER.use(authMiddleware);

ENROLLMENT_ROUTER.get(
    "/my",
    authorize("student"),
    async (req, res, next) => {
        try {
            const enrollments = await getMyEnrollments(req.user.userId);
            res.status(200).json(enrollments);
        } catch (error) {
            next(error);
        }
    }
);

ENROLLMENT_ROUTER.post(
    "/",
    authorize("admin"),
    createEnrollmentValidator,
    async (req, res, next) => {
        try {
            const enrollment = await create(req.body);

            res.status(201).json(enrollment);
        } catch (error) {
            next(error);
        }
    }
);

ENROLLMENT_ROUTER.get(
    "/",
    authorize("admin"),
    async (req, res, next) => {
        try {
            const enrollments = await getAll();

            res.status(200).json(enrollments);
        } catch (error) {
            next(error);
        }
    }
);

ENROLLMENT_ROUTER.get(
    "/:id",
    authorize("admin"),
    async (req, res, next) => {
        try {
            const enrollment = await find({
                _id: req.params.id
            });

            res.status(200).json(enrollment);
        } catch (error) {
            next(error);
        }
    }
);

ENROLLMENT_ROUTER.patch(
    "/:id",
    authorize("admin"),
    updateEnrollmentValidator,
    async (req, res, next) => {
        try {
            const enrollment = await update(
                req.params.id,
                req.body
            );

            res.status(200).json(enrollment);
        } catch (error) {
            next(error);
        }
    }
);

ENROLLMENT_ROUTER.delete(
    "/:id",
    authorize("admin"),
    async (req, res, next) => {
        try {
            const enrollment = await destroy(req.params.id);

            res.status(200).json(enrollment);
        } catch (error) {
            next(error);
        }
    }
);

export default ENROLLMENT_ROUTER;