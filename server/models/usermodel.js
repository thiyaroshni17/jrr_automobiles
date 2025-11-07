const mongoose = require('mongoose')
require('express')


const UserModels = mongoose.Schema({
    Name:{
        type : String,
        required: true 
    },
    email:{
        type : String,
        required: true ,
        unique:true
    },
    password:{
        type : String,
        required: true ,
    },
    userID:{
        type: String,
        required: true,
        unique:true
    },
    ResetOTP:{
        type: String,
        default:''
    },
    ResetOTPexpireAt:{
        type:Number,
        default:0
    }
})

module.exports = mongoose.model('UserSchema',UserModels)