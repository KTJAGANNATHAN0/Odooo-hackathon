export const defaultProductImage = './images/steel_rods.png';

export function resolveProductImageUrl(imageUrl?: string): string {
  const source = imageUrl?.trim();
  if (!source) return defaultProductImage;
  if (/^(?:[a-z]+:)?\/\//i.test(source) || source.startsWith('data:')) return source;
  return source.startsWith('/') ? `.${source}` : source;
}
