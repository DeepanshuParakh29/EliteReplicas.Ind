import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";

export const useProducts = () => {
  return useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
};

export const useFeaturedProducts = () => {
  return useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });
};

export const useProduct = (id: string) => {
  return useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });
};
