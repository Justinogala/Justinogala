
const LOGO_KEY = 'munal_brand_logo';

export const logoUploadService = {
  uploadLogo: async (file) => {
    return new Promise((resolve, reject) => {
      // 1. Validate File
      const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        reject(new Error("Invalid file type. Please upload PNG, JPG, or SVG."));
        return;
      }

      // 2. Validate Size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        reject(new Error("File size too large. Max size is 2MB."));
        return;
      }

      // 3. Convert to Base64 (Mock storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target.result;
        try {
          localStorage.setItem(LOGO_KEY, base64String);
          resolve(base64String);
        } catch (err) {
          reject(new Error("Storage quota exceeded. Cannot save logo locally."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  getLogo: () => {
    return localStorage.getItem(LOGO_KEY);
  },

  removeLogo: () => {
    localStorage.removeItem(LOGO_KEY);
  },

  // Mock validation helper
  validateDimensions: (file) => {
    // In a real app, you might check image dimensions here
    return Promise.resolve(true);
  }
};
