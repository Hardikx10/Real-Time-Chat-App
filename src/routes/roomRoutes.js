require('dotenv').config()
const express=require('express')
const jwt =require('jsonwebtoken')
const router=express.Router()
const auth=require('../authMiddleware')
const {User,Message,Room} = require('../models')


router.post('/createRoom',auth,async(req,res)=>{

    const {name , users} = req.body
    console.log(req.body);
    const usersArr=[users]
    if (!name || !users) {
        return res.status(400).send({ error: 'Missing required fields: name or users' });
    }
    
    try {

        let room = await Room.findOne({ name });
        if (room) {
            return res.status(400).json({ message: 'A Room already exists with this name' });
        }
        room=new Room({
            name,
            users:usersArr
        })
        await room.save()

        res.status(201).send([{
            _id: room._id,
            name: room.name,
            users:room.users
        }]);

    } catch (error) {
        
        res.status(500).json({ message: 'Server error' });
        
    }

})

router.get('/getRooms', auth, async (req, res) => {
    try {
        // Fetch all rooms from the database
        let rooms = await Room.find({});
        
        // Send the rooms as a response with a 200 status code
        res.status(200).json({
            success: true,
            rooms
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);

        // Send a 500 status code if there's a server error
        res.status(500).json({
            success: false,
            message: 'Server error, could not fetch rooms'
        });
    }
});

router.get('/:roomId', async (req, res) => {
    console.log(req.params.roomId);
    
    try {
        const room = await Room.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json({ room });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/joinRoom',auth,async(req,res)=>{

    const {name , users} = req.body
    console.log(req.body);
    

    try {

        let room = await Room.findOne({ name });
        if (!room) {
            return res.status(400).json({ message: 'Room Does not exists' });
        }
        room = await Room.findOneAndUpdate(
            { name: name },
            { $push: { users: users } },
            { new: true } // Return the updated room
        );
      
        res.status(201).json({
            roomId: room._id,
            name: room.name,
            users: room.users
        });

    } catch (error) {
        
        res.status(500).json({ message: 'Server error' });
        
    }

})


module.exports=router