import { notesApi } from '@/api/notes';
import { toast } from 'sonner';

/**
 * Downloads a note file directly to the user's device.
 * Triggers native browser download without opening/redirecting to Cloudinary website.
 *
 * @param {Object} note - Note model object containing _id, title, fileName, fileUrl, etc.
 * @returns {Promise<boolean>} True if download initiated successfully, false otherwise.
 */
export async function downloadNoteFile(note) {
  if (!note) {
    toast.error('Unable to download note');
    return false;
  }

  // Derive an appropriate base filename
  let fallbackName = note.fileName;
  if (!fallbackName) {
    const rawTitle = note.title ? note.title.trim().replace(/[/\\?%*:|"<>]/g, '_') : 'study_material';
    fallbackName = `${rawTitle}.pdf`;
  }

  try {
    let blob = null;
    let finalFileName = fallbackName;

    // Primary: Authenticated backend download endpoint
    if (note._id) {
      try {
        const downloadRes = await notesApi.downloadNote(note._id);
        if (downloadRes) {
          if (downloadRes instanceof Blob) {
            blob = downloadRes;
          } else if (downloadRes.blob instanceof Blob) {
            blob = downloadRes.blob;
            if (downloadRes.fileName) {
              finalFileName = downloadRes.fileName;
            }
          }
        }
      } catch (backendErr) {
        console.warn('Backend proxy download returned error, attempting direct storage retrieval:', backendErr);
      }
    }

    // Secondary: Direct storage retrieval fallback
    if (!blob && note.fileUrl) {
      let downloadUrl = note.fileUrl;

      // Try with Cloudinary transformation if applicable
      if (downloadUrl.includes('/image/upload/') && downloadUrl.endsWith('.pdf')) {
        downloadUrl = downloadUrl.replace(/\.pdf$/i, '.png');
        if (finalFileName.endsWith('.pdf')) {
          finalFileName = finalFileName.replace(/\.pdf$/i, '.png');
        }
      }

      const res = await fetch(downloadUrl);
      if (res.ok) {
        blob = await res.blob();
      } else {
        const fallbackRes = await fetch(note.fileUrl);
        if (!fallbackRes.ok) {
          throw new Error(`File retrieval failed with status ${fallbackRes.status}`);
        }
        blob = await fallbackRes.blob();
      }
    }

    if (!blob || blob.size === 0) {
      throw new Error('Empty file content received');
    }

    // Trigger browser native download via temporary object URL
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke object URL after delay to free memory
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);

    toast.success('Note downloaded successfully');
    return true;
  } catch (error) {
    console.error('Note download failure:', error);
    toast.error('Unable to download note');
    return false;
  }
}
