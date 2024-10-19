require('dotenv').config()
const express=require('express')
const jwt =require('jsonwebtoken')
const router=express.Router()
const auth=require('../authMiddleware')
const {User,Message,Room} = require('../models')


router.post('/send',auth,async(req,res)=>{

    const {room ,user, message}=req.body
    console.log(req.body);

    try {
        
        let Msg = new Message({
            room,
            user,
            message
        });
      
        await Msg.save();

        res.status(201).json({
            room:Msg.room,
            user:Msg.user,
            message:Msg.message
        })

    } catch (error) {

        res.status(500).json({msg:'Server error'})
        
    }
    
})
// Fetch messages for a specific room
router.get('/:roomId', async (req, res) => {
    const { roomId } = req.params;

    try {
        const messages = await Message.find({ room:roomId }).sort({ timestamp: 1 });
        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

module.exports=router