import mongoose from "mongoose";
import UserProfile from '../models/UserProfile.js';
import User from '../models/Users.js'
import { validateUpdateInput } from './validateUpdateInput.js';

export const CreateUserProfile = async (req, res, next) => {
    try {
        const { id, name,
            username,
            bio,
            avatarUrl,
            coverPhotoUrl,
            location,
            website,

        } = req.body;
const user = await User.findById(id); 
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    const joinedAt = user.createdAt; 

    const newUserProfile = new UserProfile({
        id,
        name,
        username,
        bio,
        avatarUrl,
        coverPhotoUrl,
        location,
        website,
        joinedAt
        
    });
        await newUserProfile.save();

        res.status(200).send({
            success: true,
            message: "User profile successfully created!",
            data: newUserProfile
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: 'There was an error processing your request',
            error: err.message,
        });
    }
};

//Get a user profile
export const getUserProfile = async (req, res, next) => {
    try {
        const { userId } = req.params; 
        console.log(userId);

        const profile = await UserProfile.findOne({ id: userId }); 

        if (!profile) {
            return res.status(404).json({ success: false, message: "User profile not found" });
        }

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error("Error fetching user profile:", err);
        res.status(500).json({
            success: false,
            message: "There was an error processing your request",
            error: err.message,
        });
    }
};

export const updateUserProfile = async (req, res, next) => {
    const { userId } = req.body; 
    const authenticatedUserId = req.user.id; 

    try {
        // Authorization check
        if (userId !== authenticatedUserId) {
            console.log("Unauthorized to update this profile." );
            return res.status(403).json({ 
                success: false, 
                message: "Unauthorized to update this profile." 
            });
        }

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid userId format." 
            });
        }

        // Input validation with Joi
        const { error } = validateUpdateInput(req.body);
        if (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.details[0].message 
            });
        }
        
        // Perform the update
        const updatedUser = await UserProfile.findOneAndUpdate(
            {id: userId}, 
            { $set: req.body }, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ 
                success: false, 
                message: "User profile not found." 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "User profile updated successfully.", 
            data: updatedUser 
        });

    } catch (err) {
        console.error("Error updating user profile:", err); 
        next(err); 
    }
};