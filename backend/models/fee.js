import { Schema, model } from "mongoose";

const feeSchema = new Schema(
    {
        studentId:{
            type: Schema.Types.ObjectId,
            ref:"Student",
            required: true
        },
        courseId:{
            type:Schema.Types.ObjectId,
            ref: "course",
            required: true
        },
        totalFee: {
            type:Number,
            required: true
        },
        paidAmount:{
            type:Number,
            default:0
        },
        dueAmount:{
            type:Number,
            required: true
        },
        status:{
            type:String,
            enum:['paid','partial',"unpaid"],
            default:"unpaid"
        },
        
        paymentDate: Date

    },
    {timestamps:true}
);

const  Fees = model("Fees", feeSchema);
export default Fees;