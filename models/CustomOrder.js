// models/Order.js
import mongoose from 'mongoose';

const CustomOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  frontImageUrl: {
    type: String,
    required: true
  },
  sideImageUrl: {
    type: String,
    required: false 
  },
  userHeightCm: {
    type: Number,
    required: true
  },

  ai_measurement_data: {
    tool: { type: String, enum: ['geometric', 'live'] },
    status: { type: String },
    unit: { type: String, default: 'cm' },
    warnings: [{ type: String }],
    
    measurements: {
      height: Number,
      shoulder_width: Number,
      chest_width: Number,
      chest_circumference: Number,
      waist_width: Number,
      waist: Number,
      hip_width: Number,
      hip: Number,
      neck_width: Number,
      neck: Number,
      arm_length: Number,
      sleeve_length: Number,
      inseam: Number,
      outseam: Number,
      thigh: Number,
      calf: Number,
      ankle: Number
    },

    metadata: {
      front_image_size: { width: Number, height: Number },
      side_image_size: { width: Number, height: Number },
      
      tailor_measurement_sets: {
        shirt_required: {
          neck: Number,
          chest_circumference: Number,
          waist: Number,
          shoulder_width: Number,
          sleeve_length: Number
        },
        trouser_required: {
          waist: Number,
          hip: Number,
          inseam: Number,
          outseam: Number,
          thigh: Number
        }
      }
    }
  }
}, { timestamps: true });

export default mongoose.model('CustomOrder',  CustomOrderSchema);