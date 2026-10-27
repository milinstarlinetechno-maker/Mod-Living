export function validateInquiry(v) {
  const errors = {};
  if (v.name.trim().length < 2) errors.name = 'Please enter your name.';
  const digits = v.phone.replace(/\D/g, '');
  if (!v.phone.trim()) errors.phone = 'Please enter your phone number.';
  else if (digits.length < 8 || digits.length > 15 || !/^[+\d\s\-()]+$/.test(v.phone))
    errors.phone = 'Enter a valid phone number.';
  if (!v.city.trim()) errors.city = 'Please tell us your city.';
  if (!v.category) errors.category = 'Choose what you are interested in.';
  return errors;
}
