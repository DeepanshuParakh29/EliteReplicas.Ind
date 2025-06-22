import { Product } from "@/types";

export const getProductImageUrl = (product: Product): string => {
  if (!product.images || product.images.length === 0) {
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100";
  }
  
  // Handle both string and ProductImage types
  const firstImage = product.images[0];
  return typeof firstImage === 'string' ? firstImage : firstImage.url;
};

export const getProductBrand = (product: Product): string => {
  return product.brand || 'Unknown Brand';
};
