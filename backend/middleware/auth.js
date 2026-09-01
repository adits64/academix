import { verifyAccessToken } from "../config/jwt.js";
import { UnauthorizedError } from "../errors/unauthorized.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const [type, token] = req.headers.authorization?.split(" ") || [];
        if (!token || type !== "Bearer") {
            throw new UnauthorizedError("Authorization token is required");
        }

        req.user = verifyAccessToken(token);

        next()


    } catch (error) {
        next(new UnauthorizedError("Invalid or unauthorized token"))
    }

} 