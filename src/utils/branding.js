const MODULO_NAME = "MODULO";
const MODULO_ICON = ""; // optional: direct image URL (.png/.jpg/.webp), best: Discord CDN

function isValidImageUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) && /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(u.pathname + u.search);
  } catch { return false; }
}

function footer() {
  if (isValidImageUrl(MODULO_ICON)) return { text: MODULO_NAME, iconURL: MODULO_ICON };
  return { text: MODULO_NAME };
}

module.exports = { MODULO_NAME, MODULO_ICON, footer };
