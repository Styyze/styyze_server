import GarmentType from "../models/GarmentType.js";



export const getGarmentTypes = async(
    req,
    res,
    next
)=>{


    try{


        const {search} = req.query;



        let filter = {};



        if(search){


            filter.name = {

                $regex:
                search.trim().toLowerCase(),

                $options:"i"

            };

        }



        const garmentTypes =
        await GarmentType
        .find(filter)
        .sort({
            name:1
        });



        return res.status(200).json({

            success:true,

            garmentTypes

        });



    }

    catch(error){

        next(error);

    }


};


export const createGarmentType = async(
    req,
    res,
    next
)=>{


    try{


        let {
            name
        } = req.body;



        if(!name){


            return res.status(400).json({

                success:false,

                message:
                "Garment type name is required"

            });

        }



        // normalize
        name = name
        .trim()
        .toLowerCase();

        const existing = await GarmentType.findOne({ name });

        if(existing){

            return res.status(200).json({

                success:true,

                message:
                "Garment type already exists",

                garmentType:existing

            });


        }

        const garmentType =
        await GarmentType.create({

            name,

            // creator of this entry
            createdBy: req.user.id,


            isDefault:false

        });


        return res.status(201).json({

            success:true,

            message:
            "Garment type created successfully",

            data: garmentType

        });



    }

    catch(error){

        next(error);

    }


};