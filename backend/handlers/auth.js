import { Router } from "express";
import { login } from "../services/auth.js";
import { loginValidator } from "../validators/user.js";


const AUTH_ROUTER = Router();

AUTH_ROUTER.post('/login', loginValidator, async(req, res, next) =>{
    try {
        const token = await login(req.body);
        res.status(200).json(token)
        
    } catch (error) {
        next(error);
    }
})

export default AUTH_ROUTER;