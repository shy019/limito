import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

// Generar hash único para evitar duplicados
function generateImageHash(base64Data: string): string {
  return crypto.createHash('md5').update(base64Data).digest('hex').substring(0, 16);
}

export async function uploadImage(
  base64Data: string, 
  folder: string = 'limito', 
  publicId?: string
): Promise<string> {
  const client = getCloudinary();
  
  // Si no hay publicId, generar uno basado en hash para evitar duplicados
  const finalPublicId = publicId || generateImageHash(base64Data);
  
  // Verificar si la imagen ya existe
  try {
    const existing = await client.api.resource(`${folder}/${finalPublicId}`);
    if (existing?.secure_url) {
      console.log('✅ Imagen ya existe, reutilizando:', existing.secure_url);
      return existing.secure_url;
    }
  } catch {
    // No existe, continuar con upload
  }
  
  const result = await client.uploader.upload(base64Data, {
    folder,
    public_id: finalPublicId,
    overwrite: false, // No sobrescribir si existe
    resource_type: 'image',
    format: 'webp', // Formato optimizado
    quality: 'auto:good', // Calidad automática
    fetch_format: 'auto', // Formato automático según navegador
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' }, // Máximo 1200x1200
      { quality: 85 }, // Calidad 85%
      { fetch_format: 'auto' } // WebP/AVIF automático
    ]
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

// Optimizar URL de Cloudinary existente
export function optimizeCloudinaryUrl(url: string, width?: number, height?: number): string {
  if (!url.includes('cloudinary.com')) return url;
  
  const transformations = [
    'f_auto', // Formato automático (WebP/AVIF)
    'q_auto:good', // Calidad automática
    width ? `w_${width}` : 'w_1200',
    height ? `h_${height}` : 'h_1200',
    'c_limit' // No agrandar, solo limitar
  ].join(',');
  
  return url.replace('/upload/', `/upload/${transformations}/`);
}
