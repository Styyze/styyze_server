import Post from '../models/Post.js';

export const post_search = async (req, res)=>{
    try{
        const {q}=req.query;
        console.log('search query',q);
    
if (!q){
    return res.status(400).send({success:false, message:'No search query provided' })

}
const result= await Post.find({ caption: { $regex: q, $options: 'i' } });
res.status(200).send({success:true, data: result});
}catch(err){
res.status(500).send({ success: false, message: 'Internal server error', error: err.message });
console.log(err);}
}