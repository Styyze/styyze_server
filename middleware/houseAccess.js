import HouseMembership from "../models/HouseMembership.js";



export const requireHouseStaff = async(
    req,
    res,
    next
)=>{


    try{


        const membership = await HouseMembership.findOne({

            userId:req.user.id,

            status:"active",

            role:{
                $in:[
                    "owner",
                    "staff"
                ]
            }

        });



        if(!membership){


            return res.status(403).json({

                success:false,

                message:
                "Only house owners or staff can perform this action"

            });


        }



        req.houseMembership = membership;



        next();



    }

    catch(error){

        next(error);

    }


};