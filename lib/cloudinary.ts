import { v2 as cloudinary } from 'cloudinary';

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export async function uploadImage(base64Data: string, folder: string = 'limito', publicId?: string): Promise<string> {
  const client = getCloudinary();
  const result = await client.uploader.upload(base64Data, {
    folder,
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
  });
  return result.secure_url;
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const client = getCloudinary();
    await client.uploader.destroy(publicId);
    return true;
  } catch {
    return false;
  }
}
