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

export const login = async (req, res) => { 
  const { username, password } = req.body; 
  try { const user = await User.findOne({ username }); 
  if (!user) { return res.status(404).json({ message: 'User not found' });
 } 
 const isPasswordValid = await bcrypt.compare(password, user.password); 
 if (!isPasswordValid) { return res.status(400).json({ message: 'Invalid credentials' }); 
} 
const token = jwt.sign({ id: user._id }, process.env.JWT, { expiresIn: '1h', }); 
res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', });
 res.status(200).json({ message: 'Login successful' }); 
} catch (error){
     res.status(500).json({ message: 'Server error' });
 } };