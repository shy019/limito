import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'products');
const QUALITY = 80;
const MAX_WIDTH_DESKTOP = 1200;
const MAX_WIDTH_MOBILE = 800;

/**
 * Procesa una imagen y genera versiones optimizadas para desktop y mobile
 */
export async function processImage(
  base64Image: string,
  productId: string,
  colorName: string,
  index: number
): Promise<string> {
  // Extraer datos de la imagen base64
  const matches = base64Image.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Formato de imagen base64 inválido');
  }

  const imageBuffer = Buffer.from(matches[2], 'base64');
  
  // Normalizar nombre del color (sin espacios, lowercase)
  const normalizedColor = colorName.toLowerCase().replace(/\s+/g, '-');
  
  // Crear directorio si no existe
  await fs.mkdir(IMAGES_DIR, { recursive: true });
  
  // Nombres de archivo según nomenclatura: productId-colorName-index.webp
  const desktopFilename = `${productId}-${normalizedColor}-${index}-desktop.webp`;
  const mobileFilename = `${productId}-${normalizedColor}-${index}-mobile.webp`;
  
  const desktopPath = path.join(IMAGES_DIR, desktopFilename);
  const mobilePath = path.join(IMAGES_DIR, mobileFilename);
  
  // Procesar imagen para desktop
  await sharp(imageBuffer)
    .resize(MAX_WIDTH_DESKTOP, null, {
      withoutEnlargement: true,
      fit: 'inside'
    })
    .webp({ quality: QUALITY })
    .toFile(desktopPath);
  
  // Procesar imagen para mobile
  await sharp(imageBuffer)
    .resize(MAX_WIDTH_MOBILE, null, {
      withoutEnlargement: true,
      fit: 'inside'
    })
    .webp({ quality: QUALITY })
    .toFile(mobilePath);
  
  // Retornar ruta base (sin sufijo -desktop/-mobile)
  return `/images/products/${productId}-${normalizedColor}-${index}.webp`;
}

/**
 * Elimina imágenes de un producto
 */
export async function deleteProductImages(productId: string): Promise<void> {
  try {
    const files = await fs.readdir(IMAGES_DIR);
    const productFiles = files.filter(f => f.startsWith(`${productId}-`));
    
    await Promise.all(
      productFiles.map(file => 
        fs.unlink(path.join(IMAGES_DIR, file)).catch(() => {})
      )
    );
  } catch (error) {
    console.error('Error deleting product images:', error);
  }
}

/**
 * Elimina imágenes de un color específico
 */
export async function deleteColorImages(
  productId: string,
  colorName: string
): Promise<void> {
  try {
    const normalizedColor = colorName.toLowerCase().replace(/\s+/g, '-');
    const files = await fs.readdir(IMAGES_DIR);
    const colorFiles = files.filter(f => 
      f.startsWith(`${productId}-${normalizedColor}-`)
    );
    
    await Promise.all(
      colorFiles.map(file => 
        fs.unlink(path.join(IMAGES_DIR, file)).catch(() => {})
      )
    );
  } catch (error) {
    console.error('Error deleting color images:', error);
  }
}

/**
 * Elimina una imagen específica
 */
export async function deleteImage(imagePath: string): Promise<void> {
  try {
    // Extraer nombre de archivo de la ruta
    const filename = path.basename(imagePath);
    const desktopFile = filename.replace('.webp', '-desktop.webp');
    const mobileFile = filename.replace('.webp', '-mobile.webp');
    
    await Promise.all([
      fs.unlink(path.join(IMAGES_DIR, desktopFile)).catch(() => {}),
      fs.unlink(path.join(IMAGES_DIR, mobileFile)).catch(() => {})
    ]);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}
