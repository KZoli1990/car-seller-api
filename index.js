const express = require('express');
const {users, carItemModel} = require('./mongo');
const upload = require('./utilitis/upload');
const cloudinary = require("./utilitis/cloudinary");
const cors = require('cors');
require("dotenv").config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const authenticate = require("./auth");
app.use(cors());
const fs = require('fs');
const path = require('path');
app.get("/carsellerapi/v1", cors(), (req, res) => {});


//logOut
app.get("/carsellerapi/v1/users/logout", authenticate, (req, res) => {
    const decodedUser = req.receive;
    try{
        res.cookie("token", "", { httpOnly: true, expires: new Date(0) })
        res.json({
                message: "Logout successful",
                success: true
            });
            console.log(decodedUser);
    } catch (error){
        return res.status(500).json({error: error.message},  {status: 500})
    }
});

//login
app.post("/carsellerapi/v1/users", async (req, res) => {
    const {email, password} = req.body;

    try{
        const check = await users.findOne({email:email});

        if(check){
            const validPassword = await bcrypt.compare(password, check.password);
            if(validPassword){
                const tokenData = {
                    id: check._id,
                    avatar: check.avatar,
                    firstName: check.firstName,
                    lastName: check.lastName,
                    userName: check.userName,
                    email: check.email,
                    createdAt:check.createdAt
                };
        
                const token = jwt.sign(tokenData, process.env.TOKEN_SECRET, { expiresIn: "1d" });
        
                res.cookie("token", token, { httpOnly: true });

                return res.status(200).json({
                    token:token,
                    message: "Login successful",
                    success: true
                });
            } else {
                res.status(401).json("Wrong password...");
            }
            
        } else {
            res.status(400).json("This email not exists...");
        }
    } catch(error){
        res.status(500).json("Internal server error")
        console.log(error);
    }
});
//register
app.post("/carsellerapi/v1/users/signup", upload.single('avatar'), async (req, res) => {
    const {email, userName, password, firstName, lastName} = req.body;
    try{
        const check = await users.findOne({email:email});
        const file = req.file.path;
        if (check) {
            res.status(400).json("This email already exists...");
        } 
        if(file.length <= 1){
            if(!check){
            
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                
                const avatarPath = await cloudinary.uploader.upload(req.file.path);
                const data = {
                    userName: userName,
                    avatar: avatarPath.secure_url,
                    cloudinary_id: avatarPath.public_id,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password:hashedPassword,
                    createdAt: Date.now(),
                };
                
                await users.insertMany([data]);
                 res.status(201).json("Signup successful...");
               
            }
        } else {
            res.status(400).json("You can only have 1 profile picture...");
        }
       
    
    } catch(error){
        res.status(500).json({ error: "Internal Server Error"});
        console.log(error);
    }
});
//actual user
app.get("/carsellerapi/v1/users/loggedUser",authenticate ,async (req, res) => {
    const decodedUser = req.receive;
    res.status(200).send(decodedUser);
});
//all user
app.get("/carsellerapi/v1/allUsers", async (req, res) => {
    
    const allUser = await users.find();
    res.status(200).send(allUser);
});

//addCarItem
app.post("/carsellerapi/v1/addCar", authenticate, upload.array('photos', 999999), async(req, res, next) => {
    
    const {brand, model, design, fuel, vintage, price, cylinderCapacity, phone, country, status, text, validityOfTrafficCard} = req.body;
    const decodedUser = req.receive;
    const files = req.files;
    try {

       if(files.length <= 3){
            const photoData = await Promise.all(files.map(async (oneElement) => {
                let result = await cloudinary.uploader.upload(oneElement.path);
                let photo = {
                    path: result.secure_url,
                    cloudinary_id: result.public_id
                }
                return photo;
            }));
            const carData = {
                brand: brand,
                model: model,
                design: design, 
                vintage: vintage,
                price: price,
                cylinderCapacity: cylinderCapacity,
                phone: phone, 
                country: country, 
                status: status,
                fuel: fuel,
                text: text,
                photos: photoData,
                validityOfTrafficCard:validityOfTrafficCard,
                carCreatedAt: new Date(),
                owner: {
                    id: decodedUser.id,
                    userName: decodedUser.userName,
                    email: decodedUser.email,
                    avatar: decodedUser.avatar,
                    firstName:decodedUser.firstName,
                    lastName:decodedUser.lastName
                }
                
            }
            await carItemModel.insertMany([carData]);
            res.status(201).json('Advertisement posted...');
        } else {
            res.status(400).json('Maximum of 3 photos...')
        }
    }catch(err){
        res.status(500).json({ error: "Internal Server Error", err });
    }
});

//update car
app.put("/carsellerapi/v1/updateCar/:carId", authenticate, upload.array('photos', 99999), async (req, res, next) => {
    const carId = req.params.carId;
    const decodedUser = req.receive;
    const files = req.files;
    const {brand, model, design, fuel, vintage, price, cylinderCapacity, phone, country, status, text, validityOfTrafficCard} = req.body;
    try{
        const existingCar = await carItemModel.findById(carId);
        if(existingCar.owner.email === decodedUser.email){
            if(files.length <= 3){
                if (existingCar && existingCar.photos && existingCar.photos.length > 0) {
                    existingCar.photos.forEach( async (photo) => {
                        await cloudinary.uploader.destroy(photo.cloudinary_id);
                    });
                }
            
                const photoData = await Promise.all(files.map(async (oneElement) => {
                    let result = await cloudinary.uploader.upload(oneElement.path);
                    let photo = {
                        path: result.secure_url,
                        cloudinary_id: result.public_id
                    }
                    return photo;
                }));
                const update = {
                    brand: brand,
                    model: model,
                    design: design, 
                    vintage: vintage,
                    price: price,
                    cylinderCapacity: cylinderCapacity,
                    phone: phone, 
                    country: country, 
                    status: status,
                    fuel: fuel,
                    text: text,
                    photos: photoData,
                    validityOfTrafficCard:validityOfTrafficCard,
                    carCreatedAt: new Date(),
                    owner: {
                        id: decodedUser.id,
                        userName: decodedUser.userName,
                        email: decodedUser.email,
                        avatar: decodedUser.avatar,
                        firstName:decodedUser.firstName,
                        lastName:decodedUser.lastName
                    }
                    
                }
    
                const result = await carItemModel.findOneAndUpdate(
                    { _id: carId, 'owner.id': decodedUser.id },
                    update, 
                    { new: true }
                  );
        
                if(result){
                    res.status(200).json('Update successfully...');
                } 
            } else {
                res.status(400).json('Maximum of 3 photos...')
            }
        }else {
            res.status(404).json('Access denied !')
        }
        

    } catch(err){
        console.error("Error during update:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
    
});

//delete car
app.delete("/carsellerapi/v1/removeCar/:carId", authenticate, async (req, res, next) => {
   
    const decodedUser = req.receive;
    
    try{
        let car = await carItemModel.findById(req.params.carId);

        if (!car){
            res.status(404).send("Bad requiest...");
        }else {
            if(decodedUser.email === car.owner.email){
                car.photos.forEach(async (oneElement)=>{
                    await cloudinary.uploader.destroy(oneElement.cloudinary_id);
                });
                await car.deleteOne();
                res.status(200).send("The advertisement successfully removed...");
            } else {
                res.status(401).send("Access denied...");
            }
        }
    } catch (err){
        console.log(err);
    }
});

//response all car
app.get("/carsellerapi/v1/allCar", async (req, res) => {
    const allCar = await carItemModel.find();
    res.status(200).send(allCar);
});

app.listen(8000,function check(error){
    if(error){
        console.log('Error'+error.message);
    } else {
        console.log("Server connected...")
    }
});
