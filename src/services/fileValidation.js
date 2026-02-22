
export const MAX_FILE_SIZES = {
  AUDIO: 500 * 1024 * 1024, // 500MB
  VIDEO: 2 * 1024 * 1024 * 1024, // 2GB
  DOCUMENT: 100 * 1024 * 1024, // 100MB
  AVATAR: 10 * 1024 * 1024, // 10MB
  IMAGE: 10 * 1024 * 1024, // 10MB
};

export const ALLOWED_TYPES = {
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/ogg', 'audio/mp3'],
  VIDEO: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/avi'],
  DOCUMENT: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  AVATAR: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
};

export const ALLOWED_EXTENSIONS = {
  AUDIO: ['.mp3', '.wav', '.m4a', '.ogg'],
  VIDEO: ['.mp4', '.mov', '.avi', '.mkv'],
  DOCUMENT: ['.pdf', '.docx', '.txt', '.pptx'],
  AVATAR: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
};

export const validateFileSize = (file, type) => {
  const maxSize = MAX_FILE_SIZES[type.toUpperCase()];
  if (!maxSize) return { valid: false, error: 'Unknown file type group' };
  
  if (file.size > maxSize) {
    const sizeInMB = maxSize / (1024 * 1024);
    const sizeInGB = maxSize / (1024 * 1024 * 1024);
    const readableSize = sizeInGB >= 1 ? `${sizeInGB}GB` : `${sizeInMB}MB`;
    return { valid: false, error: `File size exceeds the limit of ${readableSize}` };
  }
  return { valid: true };
};

export const validateFileType = (file, type) => {
  const allowed = ALLOWED_TYPES[type.toUpperCase()];
  if (!allowed) return { valid: false, error: 'Unknown file type group' };

  // Check MIME type
  if (allowed.includes(file.type)) return { valid: true };

  // Fallback check for extension if MIME type is generic or missing
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const allowedExts = ALLOWED_EXTENSIONS[type.toUpperCase()];
  
  if (allowedExts && allowedExts.includes(ext)) return { valid: true };

  return { valid: false, error: `File type ${file.type || ext} is not allowed` };
};

export const validateFileExtension = (filename, type) => {
  const ext = '.' + filename.split('.').pop().toLowerCase();
  const allowed = ALLOWED_EXTENSIONS[type.toUpperCase()];
  if (!allowed) return { valid: false, error: 'Unknown file type group' };
  
  if (allowed.includes(ext)) return { valid: true };
  return { valid: false, error: `Extension ${ext} is not allowed` };
};

export const getAllowedTypes = (type) => {
  return ALLOWED_TYPES[type.toUpperCase()] || [];
};

export const getMaxFileSize = (type) => {
  return MAX_FILE_SIZES[type.toUpperCase()] || 0;
};

export const validateFile = (file, type) => {
  const typeValidation = validateFileType(file, type);
  if (!typeValidation.valid) return typeValidation;

  const sizeValidation = validateFileSize(file, type);
  if (!sizeValidation.valid) return sizeValidation;

  return { valid: true };
};
