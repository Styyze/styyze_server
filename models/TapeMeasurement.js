import mongoose from 'mongoose';

const TapeMeasurementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    houseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      required: true,
      index: true,
    },
    // unit specification 
    unit: {
      type: String,
      enum: ['in', 'cm'],
      default: 'in',
    },

    // Top measurement
    topMeasurements: {
      chestBust: { type: Number, required: true },
      tummyWaist: { type: Number, required: true },
      hips: { type: Number, required: true },
      topLength: { type: Number, required: true },
      backWidth: { type: Number, required: true },
      neckCircumference: { type: Number, default: null },
      armhole: { type: Number, default: null },
      sleeveOpening: { type: Number, default: null },
      wrist: { type: Number, default: null },
    },

    // Sleeves lenght
    sleeveLengths: {
      longSleeveLength: { type: Number, default: null },
      threeQuarterSleeveLength: { type: Number, default: null },
      shortSleeveLength: { type: Number, default: null },
    },
    // Sleeve measurement origin
    sleeveMeasurementOrigin: {
      type: String,
      enum: ['shoulder tip', 'center of back'],
      default: 'shoulder tip',
    },


    // trouser measurement
    trouserMeasurements: {
      waist: { type: Number },
      seatHips: { type: Number },
      trouserLengthOutsideLeg: { type: Number },
      thigh: { type: Number, default: null },
      knee: { type: Number, default: null },
      calf: { type: Number, default: null },
      ankle: { type: Number, default: null },
    },

    // Cap measurement
    capMeasurements: {
      headCircumference: { type: Number },
    },

   
  },
  {
    timestamps: true, 
  }
);

export const TapeMeasurement = mongoose.model('TapeMeasurement', TapeMeasurementSchema );