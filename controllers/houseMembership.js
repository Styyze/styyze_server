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
            username,
            logo
        } = req.body;
        console.log("username", username);
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
            username,
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
            data:house
        });

    } catch (error) {
        next(error);
        console.log("error", error);
    }
};
//search house
export const searchHouse = async (req, res, next) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "House name is required."
            });
        }

        const houses = await House.find({
            name: {
                $regex: name.trim(),
                $options: "i" 
            }
        });

        return res.status(200).json({
            success: true,
            count: houses.length,
            data: houses
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



        const houseId = req.user.id;



        if(!username){

            return res.status(400).json({
                success:false,
                message:"Username is required"
            });

        }

        const staffUser = await User.findOne({
            username
        });



        if(!staffUser){

            return res.status(404).json({
                success:false,
                message:"User not found"
            });

        }


        if(staffUser._id.toString() === houseId.toString()){

            return res.status(400).json({
                success:false,
                message:"Owner cannot add themselves as staff"
            });

        }
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

await createNotification({
    recipientId: invitedUserId,

    type: "staff_invite",

    title: `You've been invited to join ${house.name}`,

    body: `You've been invited to join ${house.name}`,

    meta: {
        houseId: house._id,
        houseName: house.name,
        invitedBy: req.user.id
    },

    actionUrl: null,

    requiresAction: true
});
    }

    catch(error){

        next(error);

    }

};

//get invitation
export const getInvitations = async (req, res, next) => {
    try {

        const userId = req.user.id;

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

// get staff of a House
export const getHouseStaff = async (req, res) => {
  try {
    const { houseId } = req.params;

    const staffMembers = await HouseMembership.find({
      houseId,
      role: "staff"
    }).populate({
      path: "userId",
      select: "email username name"
    });


    return res.status(200).json({
      success: true,
      staff: staffMembers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};