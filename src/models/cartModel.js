const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({

    userId:{
        type:ObjectId,
        refs:"User",
        required: true,
        unique: true
    },
    items: [{
        productId:{
            type: ObjectId,
            refs: "Product",
            required: true
        },
        
        quantity:{
            type: Number,
            required: true
        } 
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    totalItems: {
        type: Number,
        required: true
    },

}, { timestamps: true })

module.exports = mongoose.model("Cart", cartSchema)





// title:String,
//         price:Number,
//         productImage:String,