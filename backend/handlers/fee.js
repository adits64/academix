import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ForbiddenError } from "../errors/forbidden.js";

import {
    create,
    getAll,
    getMyFees,
    find,
    update,
    destroy,
    recordPayment
} from "../services/fee.js";

import {
    createFeeValidator,
    updateFeeValidator,
    feeIdValidator,
    recordPaymentValidator
} from "../validators/fee.js";

const FEE_ROUTER = Router();

FEE_ROUTER.use(authMiddleware);


FEE_ROUTER.get(
    "/my",
    authorize("student"),
    async (req, res, next) => {
        try {
            const fees = await getMyFees(req.user.userId);
            res.status(200).json(fees);
        } catch (error) {
            next(error);
        }
    }
);


FEE_ROUTER.get(
    "/",
    authorize("admin"),
    async (req, res, next) => {
        try {
            const fees = await getAll();
            res.status(200).json(fees);
        } catch (error) {
            next(error);
        }
    }
);


FEE_ROUTER.get(
    "/:id",
    feeIdValidator,
    async (req, res, next) => {
        try {
            const fee = await find({
                _id: req.params.id
            });

            
            if (req.user.role === "student") {
                const studentId = fee.studentId?._id?.toString() || fee.studentId?.toString();
                if (studentId !== req.user.userId.toString()) {
                    throw new ForbiddenError("You are not authorized to view this fee record");
                }
            } else if (req.user.role !== "admin") {
                throw new ForbiddenError("Forbidden");
            }

            res.status(200).json(fee);
        } catch (error) {
            next(error);
        }
    }
);


FEE_ROUTER.post(
    "/",
    authorize("admin"),
    createFeeValidator,
    async (req, res, next) => {
        try {
            const fee = await create(req.body);

            res.status(201).json(fee);
        } catch (error) {
            next(error);
        }
    }
);


FEE_ROUTER.patch(
    "/:id",
    authorize("admin"),
    feeIdValidator,
    updateFeeValidator,
    async (req, res, next) => {
        try {
            const fee = await update(
                req.params.id,
                req.body
            );

            res.status(200).json(fee);
        } catch (error) {
            next(error);
        }
    }
);


FEE_ROUTER.delete(
    "/:id",
    authorize("admin"),
    feeIdValidator,
    async (req, res, next) => {
        try {
            const fee = await destroy(req.params.id);

            res.status(200).json(fee);
        } catch (error) {
            next(error);
        }
    }
);


FEE_ROUTER.patch(
    "/:id/payment",
    authorize("admin"),
    recordPaymentValidator,
    async (req, res, next) => {
        try {
            const fee = await recordPayment(
                req.params.id,
                Number(req.body.amount)
            );

            res.status(200).json(fee);
        } catch (error) {
            next(error);
        }
    }
);

export default FEE_ROUTER;