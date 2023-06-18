var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    
    destination:{type:String,required:true},
    expKms:{type:Number,required:true},
    from:{type:String,required:true},
    to:{type:String,required:true}
});

module.exports = mongoose.model('tripPreset', schema);