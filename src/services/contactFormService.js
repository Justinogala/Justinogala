
import { adminMessageService } from '@/services/adminMessageService';

export const contactFormService = {
  validateContactForm: (data) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.name || data.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long";
    }

    if (!data.email || !emailRegex.test(data.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!data.subject || data.subject.trim().length < 3) {
      errors.subject = "Subject must be at least 3 characters long";
    }

    if (!data.message || data.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters long";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  submitContactForm: async (data) => {
    try {
      const validation = contactFormService.validateContactForm(data);
      if (!validation.isValid) {
        throw new Error("Validation failed");
      }

      const result = await adminMessageService.saveContactFormMessage(data);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Contact form submission error:", error);
      return {
        success: false,
        error: error.message || "Failed to submit message"
      };
    }
  }
};
