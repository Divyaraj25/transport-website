const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  vehicle_type: {
    type: String,
    required: true,
    unique:true
  },
  vehicle_image: {
    type: String,
  },
});

vehicleSchema.post('validate',(error,doc,next)=>{
  next(new mongoose.Error(error.message))
})

vehicleSchema.post('save',(error,doc,next)=>{
  if(error.code === 11000){
    return next(new mongoose.Error("This vehicle type is already registered"))
  }
  next(error)
})

exports.vehicleModel = mongoose.model("vehicle", vehicleSchema);
