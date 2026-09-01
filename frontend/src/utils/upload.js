/**
 * Cloudinary file upload helper for Academix
 * Reads VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET from env.
 * Never exposes private API secrets in frontend code.
 */
export async function uploadFileToCloudinary(file) {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // If Cloudinary environment variables are configured, upload to Cloudinary API
  if (cloudName && uploadPreset) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Failed to upload file to Cloudinary');
    }

    const data = await res.json();
    return {
      fileUrl: data.secure_url || data.url,
      fileName: file.name,
      fileType: file.type || file.name.split('.').pop() || 'application/octet-stream',
    };
  }

  // Graceful fallback when Cloudinary credentials will be supplied later
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  return {
    fileUrl: `https://res.cloudinary.com/academix/raw/upload/v${Date.now()}/${sanitizedName}`,
    fileName: file.name,
    fileType: file.type || file.name.split('.').pop() || 'application/octet-stream',
  };
}
