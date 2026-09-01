const errorMiddleware = async (err, req, res, next) => {
    const statusCode = err.statusCode ?? res.statusCode ?? 500;
    res.status(statusCode).json({
        success: "false",
        message: err.message || "something went wrong",
        stack: process.env.NODE_ENV === "production" ? null: err.stack,
        ...(err.errors?.length > 0 && {
            errors: err.errors.map((error)=>({
                    field: error.path,
                    message: error.msg,
                })),
        }),
    });

}
export default errorMiddleware;

