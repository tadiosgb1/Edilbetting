'use strict';

const { Brand } = require('../Models');

const DEFAULT_BRAND = {
  primary: '#F59E0B',
  secondary: '#0F172A',
  tertiary: '#1E293B',
};

function normalizeHex(value, fallback) {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : fallback;
}

function normalizeBrand(input = {}) {
  return {
    primary: normalizeHex(input.primary, DEFAULT_BRAND.primary),
    secondary: normalizeHex(input.secondary, DEFAULT_BRAND.secondary),
    tertiary: normalizeHex(input.tertiary, DEFAULT_BRAND.tertiary),
  };
}

async function getBrand(_req, res) {
  let brand = await Brand.findByPk(1);
  if (!brand) {
    brand = await Brand.create({ id: 1, ...DEFAULT_BRAND });
  }
  res.json({ success: true, data: normalizeBrand(brand.toJSON()) });
}

async function updateBrand(req, res) {
  const brandValues = normalizeBrand(req.body);
  const invalid = Object.entries(req.body || {}).some(([key, value]) =>
    ['primary', 'secondary', 'tertiary'].includes(key) &&
    !/^#[0-9a-f]{6}$/i.test(String(value || '').trim())
  );
  if (invalid) {
    return res.status(400).json({
      success: false,
      error: 'Brand colors must be valid 6-digit hex values.',
    });
  }

  const [brand] = await Brand.findOrCreate({
    where: { id: 1 },
    defaults: { id: 1, ...DEFAULT_BRAND },
  });
  await brand.update(brandValues);
  res.json({
    success: true,
    message: 'Brand colors saved.',
    data: normalizeBrand(brand.toJSON()),
  });
}

module.exports = { getBrand, updateBrand, DEFAULT_BRAND };
