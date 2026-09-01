import { ForbiddenError } from "../errors/forbidden.js";

export const authorize = (...roles) => {

    return async (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return next(
                new ForbiddenError("Forbidden")
            );
        }

        next();
    };
};