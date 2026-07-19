import mongoose from "mongoose";

const { Schema } = mongoose;


const priceListSchema = new Schema(
    {

        
        houseId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },


        
        garmentType: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },


        
        basePrice: {
            type: Number,
            required: true,
            min: 0,
        },


        
        premiumPrice: {
            type: Number,
            default: null,
            min: 0,
        },


        currency: {
            type: String,
            default: "NGN",
            uppercase: true,
            trim: true,
        },


    },

    {
        timestamps: true,
    }
);



priceListSchema.index(
    {
        houseId: 1,
        garmentType: 1,
    },
    {
        unique: true,
    }
);



export default mongoose.model("PriceList", priceListSchema);