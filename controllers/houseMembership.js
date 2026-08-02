import User from "../models/Users.js";
import HouseMembership from "../models/HouseMembership.js";

import House from "../models/House.js";


export const createHouse = async (req, res, next) => {
    try {
        const {
            name,
            description,
            address,
            phone,
            email,
            logo
        } = req.body;
// check if a house name already exist
const existingHouseName= await House.findOne({name: name.toLowerCase()})
if (existingHouseName){
    return res.status(400).json({
                success: false,
                message: " House name already exist."
            });
}
        // Prevent a user from creating multiple houses 
        const existingHouse = await House.findOne({
            houseId: req.user.id
        });

        if (existingHouse) {
            return res.status(400).json({
                success: false,
                message: "You already own a house."
            });
        }

        // Create the house
        const house = await House.create({
            ownerId: req.user.id,
            name,
            description,
            address,
            phone,
            email,
            logo
        });

        // Make the creator the owner
        await HouseMembership.create({
            userId: req.user.id,
            houseId: req.user.id,
            role: "owner",
            status: "active",
            invitedAt: new Date(),
            joinedAt: new Date()
        });

        return res.status(201).json({
            success: true,
            message: "House created successfully.",
            house
        });

    } catch (error) {
        next(error);
    }
};

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

//get invitation
export const getInvitations = async (req, res, next) => {
    try {

        // Logged-in user's ID
        const userId = req.user.id;


        // Find pending invitations for logged-in user
        const invitations = await HouseMembership.find({
            userId,
            status: "invited"
        })
        .populate("houseId", "name description address phone email logo")
        .populate("userId", "username email");


        return res.status(200).json({
            success: true,
            message: "Invitations fetched successfully",
            count: invitations.length,
            invitations
        });


    } catch (error) {

        next(error);

    }
};