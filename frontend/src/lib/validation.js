// Form validation utilities

// Name validation - only letters allowed
export const validateName = (name) => {
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!name.trim()) {
    return 'This field is required';
  }
  if (!nameRegex.test(name)) {
    return 'Only letters and spaces are allowed';
  }
  return '';
};

// Phone validation - exactly 10 digits
export const validatePhone = (phone) => {
  const phoneRegex = /^\d{10}$/;
  if (!phone.trim()) {
    return 'Phone number is required';
  }
  if (!phoneRegex.test(phone)) {
    return 'Phone number must be exactly 10 digits';
  }
  return '';
};

// Birthday validation - user must be 18 or older
export const validateBirthday = (birthday) => {
  if (!birthday) {
    return 'Birthday is required';
  }
  
  const today = new Date();
  const birthDate = new Date(birthday);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) 
    ? age - 1 
    : age;
  
  if (actualAge < 18) {
    return 'You must be at least 18 years old';
  }
  
  return '';
};

// Get max date for birthday input (18 years ago)
export const getMaxBirthdayDate = () => {
  const today = new Date();
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return eighteenYearsAgo.toISOString().split('T')[0];
};

// ID Card validation - 12 digits OR 9 digits + V/v
export const validateIdCard = (idCard) => {
  const id12Regex = /^\d{12}$/; // 12 digits
  const id9VRegex = /^\d{9}[Vv]$/; // 9 digits + V or v
  
  if (!idCard.trim()) {
    return 'ID card number is required';
  }
  
  if (!id12Regex.test(idCard) && !id9VRegex.test(idCard)) {
    return 'ID must be either 12 digits or 9 digits followed by V';
  }
  
  return '';
};

// Formatting functions for real-time input
export const formatPhone = (value) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Limit to 10 digits
    return cleaned.slice(0, 10);
};

export const formatName = (value) => {
    // Remove any non-letter and non-space characters, prevent special characters
    return value.replace(/[^A-Za-z\s]/g, '');
};

export const formatIdCard = (value) => {
    // Remove any non-alphanumeric characters, allow only digits and V
    const cleaned = value.replace(/[^0-9Vv]/g, '');
    // Convert V to uppercase for consistency
    return cleaned.replace(/v/g, 'V');
};

// Input event handlers that prevent invalid characters
export const handleNameInput = (e) => {
    const formatted = formatName(e.target.value);
    e.target.value = formatted;
    return formatted;
};

export const handlePhoneInput = (e) => {
    const formatted = formatPhone(e.target.value);
    e.target.value = formatted;
    return formatted;
};

export const handleIdCardInput = (e) => {
    const formatted = formatIdCard(e.target.value);
    e.target.value = formatted;
    return formatted;
};
