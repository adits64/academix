export class UnauthorizedError extends Error{
    constructor(message = "Unauthorized error"){
        super(message);
        this.name= "UnauthorizedError";
        this.statusCode = 401;
    }
}