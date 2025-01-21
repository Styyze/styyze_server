import WaitList from '../models/WaitList.js'
import User from '../models/Users.js';
import bcrypt from 'bcryptjs';


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
export const createUser= async (req,res,next)=>{
  try{
    const salt=bcrypt.genSaltSync(10)
    const hash=bcrypt.hashSync(req.body.password,salt)
const newUser= new User({
  ...req.body,
  password:hash,})
  
await newUser.save()
res.status(200).send(newUser)
console.log("user created!")
  }catch (err) {
    if (err.code === 11000) { 
      const field = Object.keys(err.keyPattern)[0]; 
      res.status(400).send(`The ${field} already exists!`);
    } else {
      res.status(500).send('Internal server error');
    }
    console.log(err);
  }
}

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
  httpOnly:true
}).status(200).json({details:{...otherDetails},isAdmin})

  }catch(err){
    next(err)
  }
}

export const AdminLogin = async (req, res, next) => {
  try {
    const admin = await User.findOne({ username: req.body.username });
    if (!admin) return res.send("No user found");

    const isPasswordCorrect = await bcrypt.compare(req.body.password, admin.password);
    if (!isPasswordCorrect) return res.send( "Wrong password or username");

    const token = jwt.sign({
      id: admin._id,
      isAdmin: admin.isAdmin,
      username: admin.username 
    }, "#@%itsx#$%trong");

    // Exclude sensitive details from the response
    const { password, isAdmin, ...otherDetails } = admin._doc;

    // Send the token as a cookie to the client
    res.cookie("access_token", token, {
      httpOnly: true
    }).status(200).json({
      details: { ...otherDetails, username: admin.username }, 
      isAdmin
    });
    
    console.log('hello login');
  } catch (err) {
    next(err);
  }
}
