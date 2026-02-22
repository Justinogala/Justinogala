
export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

export const validateName = (name) => {
  return name && name.trim().length >= 2;
};

export const validateUserForm = (formData) => {
  const errors = {};

  if (!validateName(formData.name)) {
    errors.name = "Name must be at least 2 characters long";
  }

  if (!formData.email) {
    errors.email = "Email is required";
  } else if (!validateEmail(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!formData.role) {
    errors.role = "Role is required";
  }

  if (!formData.plan) {
    errors.plan = "Plan is required";
  }

  if (!formData.status) {
    errors.status = "Status is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
