const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema({
  flagImageUrl: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  currency: {
    type: String,
    required: true,
  },
  currency_symbol:{
    type: String,
    required: true,
  },
  call_code: {
    type: String,
    required: true,
  },
  timezone: {
    type: String,
    required: true,
  },
  lat_lng: {
    type: [Number],
    required: true,
  },
  cca2: {
    type: String,
    required: true,
  },
});

countrySchema.post('save',(error,doc,next)=>{
    if(error.code === 11000){
        return next(new mongoose.Error("country already exists"))
    }
    next(error)
})

exports.countryModel = mongoose.model("country", countrySchema)