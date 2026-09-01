import { Schema, model } from "mongoose";

const enrollmentSchema = new Schema(
    {
        studentId:{
            type: Schema.Types.ObjectId,
            ref:"User",
            required: true
            },

        courseId:{
            type: Schema.Types.ObjectId,
            ref:"Course",
            required: true
        },
        batchId:{
            type: Schema.Types.ObjectId,
            require: true
        },
        enrollmentDate:{
            type: Date,
            default:Date.now
        },
        status:{
            type: String,
            enum:["active" ,"completed", "cancelled"],
            default: "active"
        }
    },
    { timestamps:true }

    
);

 const Enrollment = model("Enrollment", enrollmentSchema);
 export default Enrollment;