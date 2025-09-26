// Schedule validation utilities

// Get minimum date (tomorrow)
export const getMinPickupDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Get maximum date (one week from tomorrow)
export const getMaxPickupDate = () => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 8); // tomorrow + 7 days
  return maxDate.toISOString().split('T')[0];
};

// Validate pickup date
export const validatePickupDate = (date) => {
  if (!date) {
    return 'Pickup date is required';
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 8);
  
  // Reset time to compare only dates
  selectedDate.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  maxDate.setHours(0, 0, 0, 0);
  
  if (selectedDate < tomorrow) {
    return 'Pickup date must be from tomorrow onwards';
  }
  
  if (selectedDate > maxDate) {
    return 'Pickup date must be within one week from tomorrow';
  }
  
  return '';
};

// Validate pickup time (6 AM - 8 PM)
export const validatePickupTime = (time) => {
  if (!time) {
    return 'Pickup time is required';
  }
  
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  const minTime = 6 * 60; // 6 AM
  const maxTime = 20 * 60; // 8 PM
  
  if (timeInMinutes < minTime || timeInMinutes > maxTime) {
    return 'Pickup time must be between 6:00 AM and 8:00 PM';
  }
  
  return '';
};

// Validate due time (at least 1 hour after pickup time)
export const validateDueTime = (pickupTime, dueTime) => {
  if (!dueTime) {
    return 'Due time is required';
  }
  
  if (!pickupTime) {
    return 'Please select pickup time first';
  }
  
  const [pickupHours, pickupMinutes] = pickupTime.split(':').map(Number);
  const [dueHours, dueMinutes] = dueTime.split(':').map(Number);
  
  const pickupTimeInMinutes = pickupHours * 60 + pickupMinutes;
  const dueTimeInMinutes = dueHours * 60 + dueMinutes;
  
  // Due time must be between 6 AM - 8 PM
  const minTime = 6 * 60; // 6 AM
  const maxTime = 20 * 60; // 8 PM
  
  if (dueTimeInMinutes < minTime || dueTimeInMinutes > maxTime) {
    return 'Due time must be between 6:00 AM and 8:00 PM';
  }
  
  // Due time must be at least 1 hour after pickup time
  const minimumDueTime = pickupTimeInMinutes + 60; // 1 hour later
  
  if (dueTimeInMinutes <= pickupTimeInMinutes) {
    return 'Due time must be after pickup time';
  }
  
  if (dueTimeInMinutes < minimumDueTime) {
    return 'Due time must be at least 1 hour after pickup time';
  }
  
  return '';
};

// Format time for display
export const formatTimeForDisplay = (time) => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

// Get suggested due time (1 hour after pickup time)
export const getSuggestedDueTime = (pickupTime) => {
  if (!pickupTime) return '';
  
  const [hours, minutes] = pickupTime.split(':').map(Number);
  let newHours = hours + 1;
  let newMinutes = minutes;
  
  // Handle overflow (e.g., if pickup is at 8 PM, due time would be 9 PM which is invalid)
  if (newHours > 20) {
    newHours = 20; // Cap at 8 PM
    newMinutes = 0;
  }
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
};

// Comprehensive validation for the entire schedule form
export const validateScheduleForm = (formData) => {
  const errors = {};
  
  const dateError = validatePickupDate(formData.pickupDate);
  if (dateError) errors.pickupDate = dateError;
  
  const timeError = validatePickupTime(formData.pickupTime);
  if (timeError) errors.pickupTime = timeError;
  
  const dueTimeError = validateDueTime(formData.pickupTime, formData.pickupDueTime);
  if (dueTimeError) errors.pickupDueTime = dueTimeError;
  
  if (!formData.wasteType) {
    errors.wasteType = 'Please select a waste type';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
