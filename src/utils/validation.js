
export const validateMeetingForm = (data) => {
  const errors = {};
  
  if (!data.title || data.title.trim().length < 3) {
    errors.title = "Title is required and must be at least 3 characters";
  }

  if (!data.date) {
    errors.date = "Date is required";
  } else if (new Date(data.date) < new Date().setHours(0, 0, 0, 0)) {
    errors.date = "Date cannot be in the past";
  }

  if (!data.time) {
    errors.time = "Time is required";
  }

  if (!data.type) {
    errors.type = "Meeting type is required";
  }

  return errors;
};

export const validateWorkplaceForm = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length < 3) {
    errors.name = "Workplace name is required and must be at least 3 characters";
  }

  if (!data.type) {
    errors.type = "Workplace type is required";
  }

  if (!data.industry) {
    errors.industry = "Industry is required";
  }

  return errors;
};

export const validateFileUpload = (file, maxSize, allowedTypes) => {
  const errors = {};

  if (!file) {
    errors.file = "No file selected";
    return errors;
  }

  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / (1024 * 1024));
    errors.file = `File size exceeds the limit of ${sizeMB}MB`;
  }

  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  const isAllowed = allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return type.toLowerCase() === fileExtension;
    }
    return file.type.match(new RegExp(type.replace('*', '.*')));
  });

  if (!isAllowed) {
    errors.file = `File type not supported. Allowed: ${allowedTypes.join(', ')}`;
  }

  return errors;
};

export const isDateInPast = (date) => {
  return new Date(date) < new Date();
};
