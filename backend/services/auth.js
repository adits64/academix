
import { compare } from "bcrypt";

import User from "../models/user.js";

import { generateAccessToken } from "../config/jwt.js";

import { UnauthorizedError } from "../errors/unauthorized.js";

export const login = async (data) => {

    const user = await User.findOne({
        email: data.email
    });

    if (!user) {
        throw new UnauthorizedError("Invalid credentials");
    }

    const passwordMatch = await compare(
        data.password,
        user.password
    );

    if (!passwordMatch) {
        throw new UnauthorizedError("Invalid credentials");
    }

    return generateAccessToken({
        userId: user._id,
        role: user.role
    });
};