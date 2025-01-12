import Post from '../models/Post.js';


export const searchPost= async (req, res) => {
     try { 
        
    const { word } = req.query; 
    if (!word)  {

            return res.status(400).send({ success: false, message: 'No search word provided' }); 

        } 
        
    const results = await Post.find({ content: { $regex: word, $options: 'i' } }); 
    res.status(200).send({ success: true, results });
 }catch (err) {
         res.status(500).send({ success: false, message: 'Internal server error', error: err.message });
          console.log(err); 
        } 
        };