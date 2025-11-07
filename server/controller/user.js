const express = require('express')
const UserModels = require('../models/usermodel.js')
const bcrypt = require('bcryptjs')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const transport = require('../database/nodemailer.js')



const register = async(req,res)=>{
    const {Name,email,password,userID} = req.body 
    if(!Name || !email || !password || !userID){
        res.json({
            success:false,
            message: "all fields to be filled"
        })
    }
    try{
        const existingUser = await UserModels.findOne({email})
        if(existingUser){
            res.json({
                success: false,
                message:"email already exist"   
             })
        }
        
            const hashedpassword = await bcrypt.hash(password,10)
            const newuser = new UserModels({Name,email,password:hashedpassword,userID})
            await newuser.save()
            const token = jwt.sign({id:newuser._id},process.env.JWT_PASS)
            res.cookie('token',token,{
                httpOnly: true,
                secure: process.env.SECURE === 'production',
                sameSite: process.env.SECURE === 'production' ? 'none' : 'strict',
               

            })
            const mail = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: "welcome to JRR Automobiles",
                text:`welcome ${Name} ,you are successfully created an account in our website rose using the email id :${email}`
            }

            await transport.sendMail(mail)


            return res.json({success:true,message:"Signed up successfully"})
        
        
    }catch(e){
        console.error(e)
        res.json({
            success:false,
            message: "failed in registration"
        })
    }
}
const login = async(req,res)=>{
    const {identifier,password} = req.body 
    if(!identifier || !password){
        res.json({
            success:false,
            message: "all fields to be filled"
        })
    }
    try{
        let existingUser;
        if(identifier.includes('@')){
            existingUser = await UserModels.findOne({email:identifier})
        }else{
            existingUser = await UserModels.findOne({userID:identifier}) 
        }
        if(existingUser){
            if(await bcrypt.compare(password,existingUser.password)){
                 const token = jwt.sign({id:existingUser._id},process.env.JWT_PASS,{expiresIn:'7d'})
            res.cookie('token',token,{
                httpOnly: true,
                secure: process.env.SECURE === 'production',
                sameSite: process.env.SECURE === 'production' ? 'none' : 'strict',
                maxAge : 7*24*60*60*1000

            })
             return res.json({success:true,message:"logged in successfully"})
            }
            else{
                res.json({
                    success:false,
                    message:"invalid password"
                })
            }
        }else{
            res.json({
                success: false,
                message:"invalid email or userID"
            })
        }
    }
catch(e){
     res.json({
            success:false,
            message: "failed to login"
        })
}
}
const logout = async(req,res)=>{
   try{
     res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.SECURE === 'production',
                sameSite: process.env.SECURE === 'production' ? 'none' : 'strict',
                maxAge : 7*24*60*60*1000

    })
    res.json({success:true,message:"your account has been logged out , login again to continue"})
   }catch(e){
        res.json({
            success:false,
            message: "failed to logout"
        })
   }
}


    
const isauth = async(req,res)=>{
    try{
          return res.json({
            success:true
         })
    }catch(e){
          res.json({
        success:false,
        message:e.message
    })

    }
}
const Resetpasswordotp = async(req,res)=>{
    const {email} = req.body
    if(!email){
        return res.json({
            success:false,
            message:"email is required"
        })
    }
    try{
        const user = await UserModels.findOne({email})
        if(!user){
        return res.json({
            success:false,
            message:"email is not found"
        })
    }
         const otp = Math.floor(100000 + Math.random()*900000)
         user.ResetOTPexpireAt = Date.now()+24*60*60*1000
         user.ResetOTP = otp
        const mail = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Reset password",
            text: `verification OTP ${otp} for password reset`
        }
        await user.save()
        await transport.sendMail(mail)
        return res.json({
            success:true,
            message:"Otp to reset your password sent to your email successfully"
        })
    }catch(e){
       return res.json({
            success:false,
            message:e.message
        })
    }
}
const resetpassword = async(req,res)=>{
    const {email,otp,password} = req.body
    if(!email || !otp || !password){
        return res.json({
            success:false,
            message:"all fileds are required"
        })
    }
    console.log("reset pass route hit")
    try{
        const user = await UserModels.findOne({email})
        if(!user){
            console.log("sending res")
            return res.json({
            success:false,
            message:"user not found"
        })
        }
        if(otp !== user.ResetOTP){
            console.log("sending res")
            return res.json({
            success:false,
            message:"invalid otp"
        })
        }
        if(user.ResetOTPexpireAt >= Date.now() && otp === user.ResetOTP){
              user.password = await bcrypt.hash(password,10)
              user.ResetOTP = ''
              user.ResetOTPexpireAt = 0
              await user.save()
              console.log("sending res")
              return res.json(({
                success:true,
                message:"password reset successful"
              }))
        }else{
            console.log("sending res")
            return res.json({
                success:false,
                message:"otp expired"
            })
        }
    }catch(e){
        return res.json({
            success:false,
            message:e.message
        })
    }
}
const userdata = async(req,res)=>{
    try{
         const {userID} = req.body
         const data = await UserModels.findById(userID)
         if(!data){
            res.json({
                success:false,
                message:"user not found"
            })
         }
           res.json({
            success:true,
            userdata : {
                Name: data.Name,
                email : data.email
            }
         })
    }catch(e){
        res.json({
            sucess:false,
            message: e.message
        })
    }
}
module.exports = {register,login,logout,isauth,Resetpasswordotp,resetpassword,userdata}