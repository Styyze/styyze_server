// controllers/post.js
import UserProfile from '../models/UserProfile.js';
import User from '../models/Users.js'

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

//Get all profile
export const getUserProfile= async (req,res,next)=>{
    try{
        const profiles = await UserProfile.find().lean()      
        res.status(200).json(posts)
        }catch(err){
            next(err)
        }
}