import WaitListSchema from '../models/WaitList.js'
import UserSchema from '../models/Users.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Add Email to Waitlist
export const register= async (req,res,next)=>{
 console.log(req.body.email);
    try{
  const newUser= new WaitListSchema({
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
export const users= async (req,res,next)=>{
  try{
    const salt=bcrypt.genSaltSync(10)
    const hash=bcrypt.hashSync(req.body.password,salt)
const newUser= new UserSchema({
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

export const login = async (req, res) => { 
  try {
     const user = await UserSchema.findOne({ email: req.body.email }); 
     if (!user) {
       return res.status(404).send({ success: false, message: 'User not found', });
       } 
    const isPasswordValid = bcrypt.compareSync(req.body.password, user.password);
     if (!isPasswordValid) { return res.status(401).send({ success: false, message: 'Invalid password', }); }
      const token = jwt.sign( { id: user._id, email: user.email }, process.env.JWT, { expiresIn: '1h' } ); 
      res.status(200).send({ success: true, message: 'Login successful', token, });
     } catch (err) { 
      res.status(500).send({ 
        success: false, message: 'Internal server error', error: err.message, 
      });
 console.log(err); 
} 
}