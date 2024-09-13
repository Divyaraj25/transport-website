const mongoose = require('mongoose')

const identityCounterSchema = new mongoose.Schema({
    counter: {
        type: Number,
        default: 1000,
    },
    model:{
        type:String,
        required:true
    },
    field:{
        type:String,
        required:true
    }
})

identityCounterSchema.index({model:1,field:1},{unique:true})

exports.createUidModel = mongoose.model('identityCounter',identityCounterSchema)
