var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    
    tripID:{type:String,required:true},
    payDate:{type:Date,required:true},
    amount:{type:Number, required:true},
    payMode:{type:String,required:true},
    remarks:{type:String,required:true},
});

module.exports = mongoose.model('payment', schema);