import { Product } from '../types';
import { PRODUCTS } from '../data';

const STORAGE_KEY = 'sirius_custom_products';

export function getCustomProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAllProducts(): Product[] {
  return [...getCustomProducts(), ...PRODUCTS];
}

export function saveCustomProduct(product: Product): void {
  const existing = getCustomProducts().filter(p => p.id !== product.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([product, ...existing]));
}

export function deleteCustomProduct(id: string): void {
  const updated = getCustomProducts().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function generateProductId(): string {
  return 'cp-' + Date.now().toString(36);
}
