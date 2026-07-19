import mongoose from "mongoose";

const { Schema } = mongoose;


const houseMembershipSchema = new Schema(

{
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index:true
    },


    houseId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required:true,
        index:true
    },


    role: {
        type:String,
        required:true,
        
    },


    status:{
        type:String,
        enum:[
            "invited",
            "active"
        ],
        default:"invited"
    },


    invitedAt: Date,

    joinedAt: Date

},

{
    timestamps:true
}

);



export default mongoose.model(
    "HouseMembership",
    houseMembershipSchema
);