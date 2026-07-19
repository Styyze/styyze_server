import mongoose from "mongoose";

const { Schema } = mongoose;


const quoteSchema = new Schema(
  {
    amount: {
      type: Number,
      min: 0,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "awaiting_house",
        "quoted",
        "accepted",
        "declined",
      ],
      default: "awaiting_house",
    },

    respondedAt: Date,

    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    _id: false,
  }
);


const pricingSchema = new Schema(
  {
    source: {
      type: String,
      enum: ["product", "pricelist", "quote"],
      required: true,
      immutable: true,
    },

    amount: {
      type: Number,
      required: function () {
        return this.source !== "quote";
      },
      min: 0,
      default: null,
    },

    currency: {
      type: String,
      default: "NGN",
      uppercase: true,
      trim: true,
      immutable: true,
    },

    priceListId: {
      type: Schema.Types.ObjectId,
      ref: "PriceList",
      default: null,
      immutable: true,
    },

    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      immutable: true,
    },

   
    finalized: {
      type: Boolean,
      default: false,
      index: true,
    },

    finalizedAt: {
      type: Date,
      default: null,
    },

    calculatedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    _id: false,
  }
);
const projectSchema = new Schema(
  {
   

    type: {
      type: String,
      enum: [
        "recreate_look",
        "create_style",
        "occasion",
      ],
      required: true,
      index: true,
    },



    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "priced",
        "accepted",
        "declined",
        "in_production",
        "ready",
        "delivered",
      ],
      default: "submitted",
      index: true,
    },


    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    houseId: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
      index: true,
    },

    sourcePostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    sourceProductId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    sourceCollectionId: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },

    

    garmentType: {
      type: String,
      lowercase: true,
      trim: true,
    },

    wantsEmbellishment: {
      type: Boolean,
      default: false,
    },

    

    references: [
      {
        type: String,
        trim: true,

        validate: {
          validator(url) {
            return /^https?:\/\/.+/i.test(url);
          },
          message: "Invalid image URL.",
        },
      },
    ],



    measurementProfileId: {
      type: Schema.Types.ObjectId,
      ref: "MeasurementProfile",
      default: null,
    },

    

    fabricSource: {
      type: String,
      enum: [ "house_provides", "customer_provides",],
      required: true,
    },

    

    eventDate: Date,

    eventRole: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    

    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },


    pricing: {
      type: pricingSchema,
      required: true,
    },

  },
  {
    timestamps: true,
  }
);



projectSchema.pre("validate", function (next) {
  if (
    ["create_style", "occasion"].includes(this.type) &&
    !this.garmentType
  ) {
    return next(
      new Error(
        "garmentType is required for create_style and occasion projects."
      )
    );
  }

  next();
});



projectSchema.index({
  customerId: 1,
  createdAt: -1,
});

projectSchema.index({
  houseId: 1,
  status: 1,
  createdAt: -1,
});

projectSchema.index({
  type: 1,
});

projectSchema.index({
  status: 1,
});

projectSchema.index({
  sourcePostId: 1,
});

projectSchema.index({
  sourceProductId: 1,
});

projectSchema.index({
  garmentType: 1,
});



export default mongoose.model("Project", projectSchema);