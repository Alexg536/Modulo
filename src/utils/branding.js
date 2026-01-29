const MODULO_NAME = "MODULO";
const MODULO_ICON = "https://media.discordapp.net/attachments/1457517538601603307/1457811095606661140/MODULO-logo-slogen-klein_1.png?ex=697862a2&is=69771122&hm=9f2763a581d03fb69548f3c8f70a56dccaacdb737d1bcf0221b0f19888d291bc&=&format=webp&quality=lossless&width=685&height=856"; // optional: direct image URL (.png/.jpg/.webp), best: Discord CDN

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
