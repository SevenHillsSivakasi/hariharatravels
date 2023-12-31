var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    tripID:{type:String},
    dateFrom:{type:Date, required:true},
    dateTo:{type:Date,required:true},
    from:{type:String, required:true},
    to:{type:String, required:true},
    startingKm:{type:Number},
    endingKm:{type:Number},
    distance:{type:Number, required:true},
    stay:{type:String, required:true},
    vehicleType:{type:String, required:true},
    ac:{type:String,required:true},
    perKM:{type:Number, required:true},
    dayRent:{type:Number,required:true},
    tripTariff:{type:Number,required:true},
    tollAmt:{type:Number,default:0},
    driverBata:{type:Number, required:true},
    driverPadi:{type:Number},
    hillCharge:{type:Number,default:0},
    permitAmount:{type:Number,default:0},
    estAmt:{type:Number,required:true},
    tripConfirmed:{type:String, default:"enquiry"},
    driverName:{type:String,default:""},
    driverAssigned:{type:Boolean, default:0},
    driverNum:{type:Number,default:""},
    vehicleAssigned:{type:Boolean, default:0},
    vehicleNo:{type:String,default:""},
    tripOver:{type:String,default:"No"},
    advanceAmt:{type:Number, default:0},
    totalTripAmt:{type:Number,required:true, default:0},
    balanceAmt:{type:Number, default:0},
    closeTrip:{type:String,default:"No"},
    paymentDone:{type:String,default:"No"},
    cusName:{type:String,required:true},
    cusAdd:{type:String,required:true},
    cusPhone:{type:String,required:true},
    cusPP:{type:String,required:true},
    dieselLtrs:{type:Number, default:0},
    mileage:{type:Number, default:0},
    expDiesel:{type:Number,default:0},
    expUpdated:{type:String,default:"No"},
    totalExpenses:{type:Number,default:0},
    netProfit:{type:Number, default:0},
    amountInWords:{type:String}
});

module.exports = mongoose.model('TripCalc', schema);