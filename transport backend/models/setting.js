const mongoose = require('mongoose')

const settingSchema = new mongoose.Schema({
    time: {
        type: Number,
        default:10
    },
    stops: {
        type: Number,
        default:1
    },
    stripeApiKey:{
        type:String,
        required:true
    },
    stripePrivateKey:{
        type:String,
        required:true
    },
    nodeMailerEmail:{
        type:String,
        required:true
    },
    nodeMailerPassword:{
        type:String,
        required:true
    },
    twilioAccountSid:{
        type:String,
        required:true
    },
    twilioAuthToken:{
        type:String,
        required:true
    },
    twilioPhoneNo:{
        type:String,
        required:true
    }
})

exports.settingModel = mongoose.model('setting',settingSchema)