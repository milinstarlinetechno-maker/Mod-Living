// Stores the enquiry on the server so the admin can see it in the Leads inbox.
// Best effort: the visitor still continues to WhatsApp if this fails.
export async function submitLead(payload) {
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });
    return { saved: res.ok };
  } catch {
    return { saved: false };
  }
}
