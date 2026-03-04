
export const MAX_FILE_SIZES = {
  AUDIO: 500 * 1024 * 1024, // 500MB
  VIDEO: 2 * 1024 * 1024 * 1024, // 2GB
  DOCUMENT: 100 * 1024 * 1024, // 100MB
  AVATAR: 10 * 1024 * 1024, // 10MB
  IMAGE: 10 * 1024 * 1024, // 10MB
};

export const ALLOWED_TYPES = {
  AUDIO: [
    'audio/mpeg', 
    'audio/wav', 
    'audio/x-wav',
    'audio/x-m4a', 
    'audio/mp4',
    'audio/ogg', 
    'audio/mp3',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'audio/x-flac',
    'audio/aiff',
    'audio/x-aiff'
  ],
  VIDEO: [
    'video/mp4', 
    'video/quicktime', 
    'video/x-msvideo', 
    'video/x-matroska', 
    'video/avi',
    'video/webm',
    'video/x-ms-wmv',
    'video/x-flv',
    'video/3gpp',
    'video/3gpp2',
    'video/ogg',
    'video/mpeg'
  ],
  DOCUMENT: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/rtf',
    'application/json',
    'text/html',
    'text/xml'
  ],
  AVATAR: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg', 'image/svg+xml', 'image/bmp', 'image/tiff']
};

export const ALLOWED_EXTENSIONS = {
  AUDIO: ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.aac', '.flac', '.aiff', '.wma'],
  VIDEO: ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv', '.flv', '.3gp', '.mpeg', '.mpg', '.ogv'],
  DOCUMENT: ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv', '.pptx', '.ppt', '.xlsx', '.xls', '.rtf', '.json', '.html', '.xml'],
  AVATAR: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif']
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
