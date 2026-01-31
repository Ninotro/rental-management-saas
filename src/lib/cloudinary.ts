import { v2 as cloudinary } from 'cloudinary'

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
}

/**
 * Upload un'immagine su Cloudinary
 * @param file - Il file come Buffer o base64 string
 * @param folder - La cartella su Cloudinary (es. 'properties', 'rooms')
 * @returns Risultato dell'upload con URL e public_id
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folder: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `rental-management/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' }, // Limita dimensioni max
          { quality: 'auto:good' }, // Ottimizzazione automatica qualità
          { fetch_format: 'auto' }, // Formato automatico (webp se supportato)
        ],
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
          })
        } else {
          reject(new Error('Upload failed: no result'))
        }
      }
    )

    uploadStream.end(fileBuffer)
  })
}

/**
 * Elimina un'immagine da Cloudinary
 * @param publicId - Il public_id dell'immagine da eliminare
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

/**
 * Genera URL ottimizzato per un'immagine
 * @param publicId - Il public_id dell'immagine
 * @param options - Opzioni di trasformazione
 */
export function getOptimizedUrl(
  publicId: string,
  options?: {
    width?: number
    height?: number
    crop?: string
  }
): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: options?.width || 800,
        height: options?.height,
        crop: options?.crop || 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      },
    ],
  })
}

export default cloudinary
