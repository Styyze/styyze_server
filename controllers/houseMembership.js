import User from "../models/Users.js";
import HouseMembership from "../models/HouseMembership.js";


export const inviteStaff = async (req, res, next) => {

    try {

        const {
            username
        } = req.body;



        // The logged-in user represents the House
        const houseId = req.user.id;



        if(!username){

            return res.status(400).json({
                success:false,
                message:"Username is required"
            });

        }



        // Find staff user from search username
        const staffUser = await User.findOne({
            username
        });



        if(!staffUser){

            return res.status(404).json({
                success:false,
                message:"User not found"
            });

        }



        // Prevent owner from adding themselves
        if(staffUser._id.toString() === houseId.toString()){

            return res.status(400).json({
                success:false,
                message:"Owner cannot add themselves as staff"
            });

        }

        // Check duplicate membership
        const existingMembership =
            await HouseMembership.findOne({

                userId: staffUser._id,

                houseId

            });



        if(existingMembership){

            return res.status(400).json({
                success:false,
                message:"User is already associated with this House"
            });

        }




        const membership =
            await HouseMembership.create({

                userId: staffUser._id,

                houseId,

                role:"staff",

                status:"invited",

                invitedAt:new Date()

            });



        return res.status(201).json({

            success:true,

            message:"Staff invitation created successfully",

            membership

        });


    }

    catch(error){

        next(error);

    }

};