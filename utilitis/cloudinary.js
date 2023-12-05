const cloudinary = require('cloudinary').v2;
          
cloudinary.config({ 
  cloud_name: process.env.COUDINARY_CLOUD_NAME, 
  api_key: process.env.COUDINARY_API_KEY, 
  api_secret: process.env.COUDINARY_API_SECRET
});

module.exports = cloudinary;