import  {TapeMeasurement} from '../models/TapeMeasurement.js';


export const createTapeMeasurement = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId; 
   

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    const {
      unit,
      topMeasurements,
      sleeveLengths,
      trouserMeasurements,
      capMeasurements, 
      houseId
    } = req.body;

   
    if (
      !topMeasurements?.chestBust ||
      !topMeasurements?.tummyWaist ||
      !topMeasurements?.hips ||
      !topMeasurements?.topLength ||
      !topMeasurements?.backWidth
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required top measurement fields marked with *.',
      });
    }

    
    const measurementData = {
      userId,
      houseId: houseId,
      sleeveMeasurementOrigin: sleeveMeasurementOrigin,
      unit: unit || 'in',
      topMeasurements: {
        chestBust: topMeasurements.chestBust,
        tummyWaist: topMeasurements.tummyWaist,
        hips: topMeasurements.hips,
        topLength: topMeasurements.topLength,
        backWidth: topMeasurements.backWidth,
        neckCircumference: topMeasurements.neckCircumference ?? null,
        armhole: topMeasurements.armhole ?? null,
        sleeveOpening: topMeasurements.sleeveOpening ?? null,
        wrist: topMeasurements.wrist ?? null,
      },
      sleeveLengths: sleeveLengths
        ? {
            longSleeveLength: sleeveLengths.longSleeveLength ?? null,
            threeQuarterSleeveLength: sleeveLengths.threeQuarterSleeveLength ?? null,
            shortSleeveLength: sleeveLengths.shortSleeveLength ?? null,
          }
        : {},
      trouserMeasurements: trouserMeasurements
        ? {
            waist: trouserMeasurements.waist ?? null,
            seatHips: trouserMeasurements.seatHips ?? null,
            trouserLengthOutsideLeg: trouserMeasurements.trouserLengthOutsideLeg ?? null,
            thigh: trouserMeasurements.thigh ?? null,
            knee: trouserMeasurements.knee ?? null,
            calf: trouserMeasurements.calf ?? null,
            ankle: trouserMeasurements.ankle ?? null,
          }
        : {},
      capMeasurements: capMeasurements
        ? {
            headCircumference: capMeasurements.headCircumference ?? null,
          }
        : {},
      
    };

    
    const newMeasurement = await TapeMeasurement.create(measurementData);

    return res.status(201).json({
      success: true,
      message: 'Measurements saved successfully!',
      data: newMeasurement,
    });
  } catch (error) {
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages,
      });
    }

    
    return res.status(500).json({
      success: false,
      message: 'Server Error. Could not save measurements.',
      error: error.message,
    });
  }
};