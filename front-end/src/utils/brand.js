export const DEFAULT_BRAND = { primary: '#F59E0B', secondary: '#0F172A', tertiary: '#1E293B' };
export const BRAND_STORAGE_KEY = 'edilbet_brand';

function normalizeHex(value, fallback) {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : fallback;
}

export function getBrand() {
  try {
    const saved = JSON.parse(localStorage.getItem(BRAND_STORAGE_KEY) || 'null');
    return { primary: normalizeHex(saved?.primary, DEFAULT_BRAND.primary), secondary: normalizeHex(saved?.secondary, DEFAULT_BRAND.secondary), tertiary: normalizeHex(saved?.tertiary, DEFAULT_BRAND.tertiary) };
  } catch (_) { return { ...DEFAULT_BRAND }; }
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)].join(' ');
}

export function applyBrand(brand = getBrand()) {
  const root = document.documentElement;
  const normalized = { primary: normalizeHex(brand.primary, DEFAULT_BRAND.primary), secondary: normalizeHex(brand.secondary, DEFAULT_BRAND.secondary), tertiary: normalizeHex(brand.tertiary, DEFAULT_BRAND.tertiary) };
  root.style.setProperty('--brand-primary', normalized.primary);
  root.style.setProperty('--brand-secondary', normalized.secondary);
  root.style.setProperty('--brand-tertiary', normalized.tertiary);
  root.style.setProperty('--brand-primary-rgb', hexToRgb(normalized.primary));
  root.style.setProperty('--brand-secondary-rgb', hexToRgb(normalized.secondary));
  root.style.setProperty('--brand-tertiary-rgb', hexToRgb(normalized.tertiary));
  return normalized;
}

export function saveBrand(brand) {
  const normalized = applyBrand(brand);
  localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('brand:changed', { detail: normalized }));
  return normalized;
}

export function resetBrand() {
  localStorage.removeItem(BRAND_STORAGE_KEY);
  const normalized = applyBrand(DEFAULT_BRAND);
  window.dispatchEvent(new CustomEvent('brand:changed', { detail: normalized }));
  return normalized;
}