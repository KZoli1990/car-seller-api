var mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
    console.log("database connected...");
})
    .catch(err => {
    console.log("Could not connect", err);
});

var Schema = mongoose.Schema;


var userSchema = new Schema({

    userName: {
        type: String,
        required: [true, "Please provide a username"],
        unique: true
    },

    avatar: String,
    cloudinary_id: String,
    firstName: {
        type: String,
        required: [true, "Please provide a firstname"],
        unique: true
    },
    lastName:{
        type: String,
        required: [true, "Please provide a lastname"],
        unique: true
    },

    email: {
        type: String,
        required: [true, "Please provide a email"],
        unique: true
    },

    password: {
        type: String,
        required: [true, "Please provide a password"],
    },

    createdAt:{
        type:Date,
        default: false
    },

    
});

var carItemSchema = new Schema ({
    brand: String,
    model: String,
    design: String,
    fuel: String,
    vintage: String,
    price: Number,
    cylinderCapacity: Number,
    phone: String,
    country: String,
    status: String,
    text: String,
    validityOfTrafficCard: String,
    carCreatedAt: Date,
    photos: [{
        path: String,
        cloudinary_id: String
    }],
    owner:{
        id: String,
        avatar: String,
        firstName: String,
        lastName: String,
        email: String,
    }
});


const users = mongoose.model('users', userSchema);
const carItemModel = mongoose.model('cars', carItemSchema);
module.exports = {users, carItemModel};
