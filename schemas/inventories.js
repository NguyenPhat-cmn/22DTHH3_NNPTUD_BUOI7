let mongoose = require('mongoose');

let inventorySchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true,
        unique: true
    },
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Stock không được âm']
    },
    reserved: {
        type: Number,
        default: 0,
        min: [0, 'Reserved không được âm']
    },
    soldCount: {
        type: Number,
        default: 0,
        min: [0, 'SoldCount không được âm']
    }
}, { timestamps: true });

module.exports = mongoose.model('inventory', inventorySchema);
