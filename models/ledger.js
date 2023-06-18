var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    
    vehicle:{type:Schema.Types.ObjectId, ref:'Garage'},
    ledgerDate:{type:Date,required:true},
    particulars:{type:String,required:true},
    details:{type:String},
    credit:{type:Number,default:0},
    debit:{type:Number, default:0},
    billCopy:{type:String}
});

module.exports = mongoose.model('ledger', schema);