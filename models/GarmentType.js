import mongoose from "mongoose";

const { Schema } = mongoose;


const garmentTypeSchema = new Schema(
    {

        name: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },


        // House that introduced this garment type
        // null for platform default garment types
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
        },


        // True for Styyze seeded garment types
        isDefault: {
            type: Boolean,
            default: false
        }

    },

    {
        timestamps: true
    }
);


// Extra safety against duplicate names caused by spaces/casing
garmentTypeSchema.pre("save", function(next){

    if(this.name){
        this.name = this.name
            .trim()
            .toLowerCase();
    }

    next();

});


const GarmentType = mongoose.model(
    "GarmentType",
    garmentTypeSchema
);


export default GarmentType;