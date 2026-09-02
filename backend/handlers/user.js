import { Router } from "express";
import { create, destroy, find, getAll, update } from "../services/user.js";
import { createUserValidator, updateUserValidator } from "../validators/user.js";
import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const USER_ROUTER = Router();
USER_ROUTER.use(authMiddleware);

USER_ROUTER.post(
    "/", 
    authorize("admin"),
    createUserValidator, 
    async (req, res, next) => {
    try {
        const user = await create(req.body);
        res.status(201).json(user);
    } catch (error) {
        
        next(error);
        
    }
});


USER_ROUTER.get(
    '/', 
    authorize("admin"), 
    async(req, res, next) => {
    try {
        const users = await getAll();
        res.status(200).json({users});
    } catch (error) {
        next(error);
    }
})


USER_ROUTER.get(
    '/:id', 
    async(req, res, next)=>{
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher' && String(req.user.userId) !== String(req.params.id)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const user = await find({_id:req.params.id },{password: 0});
        res.status(200).json({user});
    } catch (error) {
        next(error);
    }
})


USER_ROUTER.patch(
    '/:id', 
    updateUserValidator, 
    async(req, res, next) =>{
    try {
        const isAdmin = req.user.role === 'admin';
        const isSelf = String(req.user.userId) === String(req.params.id);
        if (!isAdmin && !isSelf) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const user = await update(req.params.id, req.body, isAdmin, isSelf);
        res.status(200).json({user});
    } catch (error) {
        next(error);
    }
});


USER_ROUTER.delete(
    '/:id', 
    authorize("admin"), 
    async(req, res, next)=>{
    try {
        const user = await destroy(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
});


export default USER_ROUTER;