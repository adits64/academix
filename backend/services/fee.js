import { NotFoundError } from "../errors/not-found.js";
import { ValidationError } from "../errors/validation.js";
import Fees from "../models/fee.js";

export const create = async (data) => {
    const totalFee = Number(data.totalFee);
    const paidAmount = Number(data.paidAmount) || 0;
    const dueAmount = data.dueAmount !== undefined ? Number(data.dueAmount) : Math.max(0, totalFee - paidAmount);

    let status = "unpaid";
    if (paidAmount >= totalFee && totalFee > 0) {
        status = "paid";
    } else if (paidAmount > 0) {
        status = "partial";
    }

    const feeData = {
        studentId: data.studentId,
        courseId: data.courseId,
        totalFee,
        paidAmount,
        dueAmount,
        status: data.status || status,
        paymentDate: paidAmount > 0 ? (data.paymentDate || new Date()) : undefined
    };

    const fee = await Fees.create(feeData);

    return await fee.populate([
        { path: "studentId", select: "name email" },
        { path: "courseId", select: "name code fee" }
    ]);
};

export const getAll = async () => {
    return await Fees.find()
        .populate("studentId", "name email")
        .populate("courseId", "name code fee");
};

export const getMyFees = async (studentId) => {
    return await Fees.find({ studentId })
        .populate("studentId", "name email")
        .populate("courseId", "name code fee");
};

export const find = async (param, config) => {
    const fee = await Fees.findOne(param, config)
        .populate("studentId", "name email")
        .populate("courseId", "name code fee");

    if (!fee) {
        throw new NotFoundError("Fee record not found");
    }

    return fee;
};

export const update = async (id, data) => {
    const existing = await Fees.findById(id);
    if (!existing) {
        throw new NotFoundError("Fee record not found");
    }

    const totalFee = data.totalFee !== undefined ? Number(data.totalFee) : existing.totalFee;
    const paidAmount = data.paidAmount !== undefined ? Number(data.paidAmount) : existing.paidAmount;
    const dueAmount = Number(Math.max(0, totalFee - paidAmount).toFixed(2));

    let status = "unpaid";
    if (paidAmount >= totalFee && totalFee > 0) {
        status = "paid";
    } else if (paidAmount > 0) {
        status = "partial";
    }

    const dataToUpdate = {
        ...data,
        totalFee,
        paidAmount,
        dueAmount,
        status: data.status || status,
    };

    const fee = await Fees.findByIdAndUpdate(
        id,
        dataToUpdate,
        {
            returnDocument: "after",
            runValidators: true
        }
    )
        .populate("studentId", "name email")
        .populate("courseId", "name code fee");

    return fee;
};

export const recordPayment = async (id, amount) => {
    const fee = await Fees.findById(id);

    if (!fee) {
        throw new NotFoundError("Fee record not found");
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        throw new ValidationError("Payment amount must be greater than 0");
    }

    if (fee.dueAmount === 0 || fee.paidAmount >= fee.totalFee) {
        throw new ValidationError("Payment amount cannot be greater than due amount");
    }

    if (numAmount > fee.dueAmount) {
        throw new ValidationError("Payment amount cannot be greater than due amount");
    }

    fee.paidAmount = Number((fee.paidAmount + numAmount).toFixed(2));
    fee.dueAmount = Number(Math.max(0, fee.totalFee - fee.paidAmount).toFixed(2));

    if (fee.dueAmount === 0) {
        fee.status = "paid";
    } else if (fee.paidAmount > 0) {
        fee.status = "partial";
    } else {
        fee.status = "unpaid";
    }

    fee.paymentDate = new Date();

    await fee.save();

    return await fee.populate([
        { path: "studentId", select: "name email" },
        { path: "courseId", select: "name code fee" }
    ]);
};

export const destroy = async (id) => {
    const fee = await Fees.findByIdAndDelete(id);

    if (!fee) {
        throw new NotFoundError("Fee record not found");
    }

    return fee;
};