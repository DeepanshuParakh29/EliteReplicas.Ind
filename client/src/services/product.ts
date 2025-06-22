import { Product } from "@shared/schema";

export interface ProductInput {
  id?: string; // Add optional id for updates
  name: string;
  price: number;
  description: string;
  category: string;
  brand: string;
  stock: number;
  tags: string[];
  featured: boolean;
  active: boolean;
  images: string[];
}

// Helper function to validate product data
const validateProductData = (productData: ProductInput) => {
  if (!productData.name) throw new Error("Product name is required");
  if (productData.price <= 0) throw new Error("Product price must be greater than 0");
  if (!productData.description) throw new Error("Product description is required");
  if (!productData.category) throw new Error("Product category is required");
  if (!productData.brand) throw new Error("Product brand is required");
  
  // Ensure images array is valid
  if (!Array.isArray(productData.images)) {
    productData.images = [];
  }
  
  // Convert price to string to match schema
  return {
    ...productData,
    price: productData.price.toString(),
  };
};

export const addProduct = async (productData: ProductInput): Promise<Product> => {
  const dataToSend = validateProductData(productData);
  
  console.log("Sending product data to API:", dataToSend);

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API error response:", errorData);
    throw new Error(errorData.message || errorData.details || 'Failed to add product');
  }

  return response.json();
};

export const updateProduct = async (id: string, productData: ProductInput): Promise<Product> => {
  const dataToSend = validateProductData(productData);
  
  console.log(`Updating product ${id} with data:`, dataToSend);

  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API error response:", errorData);
    throw new Error(errorData.message || errorData.details || 'Failed to update product');
  }

  return response.json();
};

export const deleteProduct = async (id: string): Promise<void> => {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API error response:", errorData);
    throw new Error(errorData.message || errorData.details || 'Failed to delete product');
  }
};