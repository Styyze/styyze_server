import UserSchema from '../models/Users.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export const signin = async (req, res) => { 
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