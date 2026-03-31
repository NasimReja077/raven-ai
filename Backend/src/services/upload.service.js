// src/services/upload.service.js

import { upload } from '../middlewares/uploadMiddleware.js';
import cloudinary, { CLOUDINARY_FOLDERS } from '../config/cloudinary.config.js';
import fs from 'fs';
import ApiError from '../utils/ApiError.js';

export const uploadAvatar = upload.single('avatars');


export const imageUploadToCloudinary = async (file, folder) =>{
     if(!file || !file.path){
          throw new Error("No valid file provided for upload");
     }
     try {
          const result = await cloudinary.uploader.upload(file.path, {
               folder,
               resource_type: 'image',
               // transformation: [{ width: 500, height: 500, crop: 'limit' }],
          });
          // Delete file from local storage after upload
          fs.unlinkSync(file.path);
          return{
               url: result.secure_url,
               publicId: result.public_id,
          };
     } catch (error) {
          if(fs.unlinkSync(file.path)){
               fs.unlinkSync(file.path);
          }
          throw new ApiError(500, `Cloudinary upload failed: ${error.message}`);
     }
};

export const imageDeleteFromCloudinary = async (publicId) => {
     try {
          await cloudinary.uploader.destroy(publicId);
     } catch (error) {
         console.error('Cloudinary deletion failed', error); 
     }
};