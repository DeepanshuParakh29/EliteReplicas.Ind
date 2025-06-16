import { motion } from "framer-motion";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Link } from "wouter";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    addItem(product);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  return (
    <Link href={`/product/${product.id}`}>
      <motion.div 
        className="glass-effect rounded-2xl overflow-hidden hover-lift group cursor-pointer"
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative overflow-hidden">
          <img 
            src={product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"} 
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" 
          />
          {product.featured && (
            <div className="absolute top-4 left-4 bg-matte-gold text-rich-black px-3 py-1 rounded-full text-sm font-semibold">
              Featured
            </div>
          )}
        </div>
        <div className="p-6">
          <h3 className="font-playfair text-xl font-semibold mb-2">{product.name}</h3>
          <p className="text-gray-400 mb-4">{product.brand}</p>
          <div className="flex items-center justify-between">
            <span className="text-matte-gold text-2xl font-bold">${product.price}</span>
            <Button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="bg-matte-gold text-rich-black hover:bg-yellow-500 px-4 py-2 text-sm neo-shadow"
            >
              {isAdding ? "Added!" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
