export function slugify(input: string | null | undefined): string {
  let text = (input ?? "").toString();
  // Basic transliteration: strip diacritics
  text = text.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  // Extra common mappings similar to Python unidecode
  text = text
    .replace(/ß/g, "ss")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/đ/g, "d")
    .replace(/þ/g, "th")
    .replace(/œ/g, "oe");
  // Trim
  text = text.trim();
  // Remove non-word except space & hyphen
  text = text.replace(/[^\w\s-]/g, "");
  // Collapse spaces/underscores/hyphens to single hyphen
  text = text.replace(/[\s_-]+/g, "-");
  // Trim leading/trailing hyphens
  text = text.replace(/^-+|-+$/g, "");
  return text.toLowerCase();
}
