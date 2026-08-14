import PriceList from "../models/PriceList.js";


export const createPriceList = async (req, res, next ) => {

    try {

        const {garmentType, basePrice,premiumPrice, currency} = req.body;



        const houseId = req.user.id;




        const existingPrice =
            await PriceList.findOne({
                houseId,
                garmentType:
                    garmentType.toLowerCase()
            });



        if(existingPrice){

            return res.status(400)
            .json({
                message:
                "Price already exists for this garment type."
            });

        }

 const priceList =  await PriceList.create({
                houseId,
                garmentType:
                garmentType.toLowerCase(),
                basePrice,
                premiumPrice,
                currency

            });



        res.status(201)
        .json({

            success:true,

            message:
            "PriceList created successfully.",

            priceList

        });



    }

    catch(error){

    console.error("Create Pricelist Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message

    })}

};



export const getHousePriceList = async ( req, res, next)=>{

    const { houseId } = req.params;
const userId= req.user.id;
    try{


        
        const priceList =
            await PriceList.find({
                houseId
            })
            .sort({
                garmentType:1
            });



        res.json({

            success:true,

            data: priceList

        });



    }

    catch(error){
  console.error("Error fetchinh pricelist", error);
        res.status(500).send({
            success: false,
            message: 'There was an error processing your request',
            error: error.message,
        });
    }

};


export const getPriceListById = async (req, res, next)=>{


    try{


        const price =
            await PriceList.findOne({

                _id:req.params.pricelistId,

                houseId:req.userId

            });



        if(!price){

            return res.status(404)
            .json({
                message:
                "PriceList item not found"
            });

        }



        res.json({

            success:true,

            price

        });



    }

    catch(error){

        next(error);

    }

};

export const updatePriceList = async (
    req,
    res,
    next
)=>{


    try{


        const {
            basePrice,
            premiumPrice,
            currency
        } = req.body;

        const price =
            await PriceList.findOne({

                _id:req.params.id,

                houseId:req.userId

            });

        if(!price){

            return res.status(404)
            .json({
                message:
                "PriceList item not found"
            });

        }



        if(basePrice !== undefined){

            price.basePrice = basePrice;

        }


        if(premiumPrice !== undefined){

            price.premiumPrice = premiumPrice;

        }


        if(currency !== undefined){

            price.currency = currency;

        }

        await price.save();

        res.json({

            success:true,

            message:
            "PriceList updated successfully.",

            price

        });

    }

    catch(error){

        next(error);

    }

};

export const deletePriceList = async (
    req,
    res,
    next
)=>{


    try{


        const price = await PriceList.findOneAndDelete({

                _id:req.params.id,

                houseId:req.userId

            });



        if(!price){

            return res.status(404)
            .json({
                message:
                "PriceList item not found"
            });

        }



        res.json({

            success:true,

            message:
            "PriceList deleted successfully."

        });



    }

    catch(error){

        next(error);

    }

};

