export class ForbiddenError extends Error{
    constructor(message = "Forbidden error"){
        super(message);
        this.name= "ForbiddenError";
        this.statusCode = 403;
    }
}