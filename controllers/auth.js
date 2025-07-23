import WaitList from '../models/WaitList.js'
import User from '../models/Users.js';
import UserProfile from "../models/UserProfile.js"; 

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


// Add Email to Waitlist
export const register= async (req,res,next)=>{
 console.log(req.body.email);
    try{
  const newUser= new WaitList({
   email: req.body.email
    

  })
  await newUser.save()
  res.status(200).send({
    success: true,
    message: "You are successfully waitlisted!",
    data: newUser
});
    }catch(err){
      console.log(err);
    if (err.code === 11000) { 
      res.status(400).send({
        success: false,
        message: 'This email is already registered on the waitlist.',
      });
    }else{
      res.status(500).send({
        success: false,
        message: 'There was an error processing your request',
        error: err.message,
    });
  }
    }
}

// Create User

export const createUser = async (req, res, next) => {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const newUser = new User({
      ...req.body,
      password: hash,
    });

    // Save new user to database
    await newUser.save();
    console.log("User created!");
    
    const joinedAt = newUser.createdAt;    
    const userProfile = new UserProfile({
      id: newUser._id,
      username: newUser.username, 
      name: newUser.name,
      joinedAt:joinedAt
    });

    // Save userProfile to database
    await userProfile.save();
    console.log("User profile created!");

    res.status(200).send(newUser);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      res.status(400).send(`The ${field} already exists!`);
    } else {
      res.status(500).send("Internal server error");
    }
    console.log(err);
  }
};

//Login

export const login= async(req,res,next)=>{
  try{
const user= await User.findOne({username:req.body.username})
if(!user) return res.send(404, "user not found");
const isPasswordCorrect= await bcrypt.compare(req.body.password, user.password)
if(!isPasswordCorrect) return res.send(400, "wrong password or username");
const token= jwt.sign({id:user._id, isAdmin: user.isAdmin}, process.env.JWT)

const {password, isAdmin, ...otherDetails}=user._doc
res.cookie("access_token",token, {
httpOnly:true,
SameSite:"strict",
maxAge:3600
    }).status(200).json({details:{...otherDetails},isAdmin})

  }catch(err){
    next(err)
  }
}

export const UserLogin = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(404).json({error:"No user found"});

    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordCorrect) return res.status(401).json( {error:"Wrong password or username"});

    const token = jwt.sign({
      id: user._id,
      username: user.username 
    }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Exclude sensitive details from the response
    const { password, isAdmin, ...otherDetails } = user._doc;

    // Send the token as a cookie to the client
    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "None",
      secure:true,
      maxAge: 3600000,
      path: '/'

    }).status(200).json({
      details: { ...otherDetails, username: user.username }, 
      isAdmin,
      access_token: token
    });

    console.log('hello login');
  } catch (err) {
    next(err);
  }
}

// Session refresh function

export const refreshToken = async (req, res) => {
  try {
    const accessToken = req.cookies.access_token;
    if (!accessToken) return res.status(401).json({ error: 'No token found' });

    jwt.verify(accessToken, process.env.JWT_SECRET, (err, userData) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired token' });

      const newToken = jwt.sign(
        { id: userData.id, username: userData.username },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.cookie('access_token', newToken, {
        HttpOnly: true,
        sameSite:"Lax",
        secure:false,
        maxAge:3600000,
        path: '/'

      }).status(200).json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during token refresh' });
  }
};

// /controllers/authController.js

export const reloadSession = async (req, res) => {
  try {
    const token = req.cookies.access_token;
    console.log(token)
    if (!token) {
      return res.status(401).json({ error: 'Access token missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Exclude sensitive fields
      const { password, ...safeUserData } = user._doc;
      return res.status(200).json({ success: true, user: safeUserData });
    });
  } catch (err) {
    console.error('Error reloading session:', err.message);
    res.status(500).json({ error: 'Server error during session reload' });
  }
};
