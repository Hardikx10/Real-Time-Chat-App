require('dotenv').config()
const express=require('express')
const bcrypt=require('bcryptjs')
const router=express.Router()
const jwt=require('jsonwebtoken')
const auth=require('../authMiddleware')
const {User} = require('../models')


router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log(req.body);
      
      const hashedPassword = await bcrypt.hash(password, 10);
    
      let user = await User.findOne({ username });
      if (user) {
        return res.status(400).json({ message: 'Username already exists' });
      }
  
    
      user = new User({
        username,
        password:hashedPassword
      });
  
      await user.save();
  
      const payload = {
        user: {
          id: user.id,
          username: user.username
        }
      };
  
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  
      res.status(201).json({
        token,
        userId: user._id,
        username: user.username
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.post('/login',async (req, res) => {
    try {
      const { username, password } = req.body;
  
      
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      
      const isMatch = await bcrypt.compare(password,user.password)
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      
      const payload = {
        user: {
          id: user.id,
          username: user.username
        }
      };
  
      const token = jwt.sign(payload,process.env.JWT_SECRET, { expiresIn: '24h' });
  
      res.json({
        token,
        userId: user._id,
        username: user.username
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });



module.exports = router