import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Product } from "@/types";
import { useAuth } from "./AuthContext";
//import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  name: string;
  price: number | string;
  quantity: number;
  image: string;
  // Include any other properties that might be needed
  [key: string]: any;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (error: any) {
      console.error("Error loading cart from localStorage:", error);
      toast({
        title: "Cart Error",
        description: error.message || "Failed to load cart from local storage.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items));
    } catch (error: any) {
      console.error("Error saving cart to localStorage:", error);
      toast({
        title: "Cart Error",
        description: error.message || "Failed to save cart to local storage.",
        variant: "destructive",
      });
    }
  }, [items, toast]);

  const addItem = (product: Product, quantity = 1) => {
    try {
      setItems((currentItems: CartItem[]) => {
        const existingItem = currentItems.find(item => item.id === product.id);
        
        if (existingItem) {
          return currentItems.map(item =>
            item.id === product.id
              ? { 
                  ...item, 
                  quantity: (item.quantity || 0) + quantity,
                  price: product.price,
                  name: product.name,
                  image: product.images?.[0] ? 
                    (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url) : 
                    ''
                }
              : item
          );
        }
        
        // Ensure image is always a string by getting the URL from the ProductImage object if needed
        const imageUrl = product.images?.[0] ? 
          (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url) : 
          '';
          
        return [...currentItems, { 
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: imageUrl
        }];
      });
      toast({
        title: "Item Added",
        description: `${product.name} added to cart.`,
      });
    } catch (error: any) {
      console.error("Error adding item to cart:", error);
      toast({
        title: "Cart Error",
        description: error.message || "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const removeItem = (productId: string) => {
    try {
      setItems((currentItems: CartItem[]) => currentItems.filter(item => item.id !== productId));
      toast({
        title: "Item Removed",
        description: "Item removed from cart.",
      });
    } catch (error: any) {
      console.error("Error removing item from cart:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    try {
      setItems((currentItems: CartItem[]) =>
        currentItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    } catch (error: any) {
      console.error("Error updating item quantity:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update item quantity.",
        variant: "destructive",
      });
    }
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
    toast({
      title: "Cart Cleared",
      description: "Your cart has been cleared.",
    });
  };

  const total = items.reduce(
    (sum: number, item: CartItem) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
      return sum + price * (item.quantity || 0);
    },
    0
  );
  const itemCount = items.reduce((sum: number, item: CartItem) => sum + (item.quantity || 0), 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      isOpen,
      setIsOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
};
