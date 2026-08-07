const SHARE_PREFIX = 'AFK1:';

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64) {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 ? '='.repeat(4 - (padded.length % 4)) : '';
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export const ShareSaveManager = {
  encodePayload(payload) {
    const json = JSON.stringify(payload);
    const checksum = simpleHash(json);
    const wrapped = JSON.stringify({ c: checksum, p: payload });
    return SHARE_PREFIX + toBase64Url(wrapped);
  },

  decodeShareCode(code) {
    const trimmed = (code || '').trim();
    if (!trimmed.startsWith(SHARE_PREFIX)) {
      throw new Error('Invalid share code format');
    }
    const raw = fromBase64Url(trimmed.slice(SHARE_PREFIX.length));
    const wrapped = JSON.parse(raw);
    const json = JSON.stringify(wrapped.p);
    if (simpleHash(json) !== wrapped.c) {
      throw new Error('Share code checksum failed — data may be corrupted');
    }
    return wrapped.p;
  },

  getQrUrl(shareCode, size = 200) {
    const encoded = encodeURIComponent(shareCode);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
  },

  async copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
};
