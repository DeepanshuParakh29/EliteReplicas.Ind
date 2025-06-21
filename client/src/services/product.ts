import { Product } from "@shared/schema";

export const addProduct = async (productData: any): Promise<Product> => {
  // Convert price to string to match schema
  const dataToSend = {
    ...productData,
    price: productData.price.toString(),
  };

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to add product');
  }

  return response.json();
};