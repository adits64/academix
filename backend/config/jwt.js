import jwt from "jsonwebtoken";

export const generateAccessToken =(
    data, expiresIn= process.env.JWT_EXPIRES_IN)  => {
        const token = jwt.sign(data, process.env.JWT_SECRET_KEY, {expiresIn} )
        return token;
}

export const verifyAccessToken = (token)=> {
    const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
    return decoded;
}
