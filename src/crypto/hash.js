// ============================================================
// SHA-256 using Web Crypto API (real, not fake)
// ============================================================

export const sha256 = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const sha256FromText = async (text) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Format hash into readable groups
export const formatHash = (hash) => {
  if (!hash) return '';
  const upper = hash.toUpperCase();
  // 8 chars per group, 4 groups per line
  return upper.match(/.{1,8}/g)?.join(' ') || upper;
};

export const formatHashShort = (hash) => {
  if (!hash) return '';
  return hash.substring(0, 8).toUpperCase() + '...' + hash.substring(hash.length - 4).toUpperCase();
};

// Generate a tampered hash (for simulation)
export const generateTamperedHash = async (originalHash) => {
  const timestamp = Date.now().toString();
  return await sha256FromText(originalHash + timestamp);
};
