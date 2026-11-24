const MAX_SIDE = 1600
const QUALITY = 0.85

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY))

/**
 * Prepares a chosen photo for upload: scales it so its longest side is at most 1600 px
 * (never upscaling) and re-encodes it as WebP at quality 0.85 (JPEG if the browser cannot
 * encode WebP). Drawing onto a canvas and encoding anew also drops all metadata, EXIF
 * included, so a phone photo's GPS location is never uploaded. That is deliberate.
 */
export async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const webp = await toBlob(canvas, 'image/webp')
  if (webp && webp.type === 'image/webp') return webp

  // JPEG has no transparency: put the image on white instead of black.
  const flat = document.createElement('canvas')
  flat.width = canvas.width
  flat.height = canvas.height
  const flatCtx = flat.getContext('2d')!
  flatCtx.fillStyle = '#fff'
  flatCtx.fillRect(0, 0, flat.width, flat.height)
  flatCtx.drawImage(canvas, 0, 0)
  const jpeg = await toBlob(flat, 'image/jpeg')
  if (!jpeg) throw new Error('This browser could not prepare the image')
  return jpeg
}
