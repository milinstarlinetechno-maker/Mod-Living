// If no number is configured yet, wa.me/?text= opens WhatsApp with the message ready.
export function buildWhatsAppUrl(number, message) {
  const text = encodeURIComponent(message);
  const digits = String(number || '').replace(/\D/g, '');
  return /^\d{8,15}$/.test(digits) ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function buildInquiryMessage(siteName, v) {
  const lines = [`Hello ${siteName}, I would like a design consultation.`, ''];
  const add = (label, value) => value && lines.push(`${label}: ${value}`);
  add('Name', v.name);
  add('Phone', v.phone);
  add('City', v.city);
  add('Interested in', v.category);
  if (v.message) lines.push('', 'About my project:', v.message);
  return lines.join('\n');
}
