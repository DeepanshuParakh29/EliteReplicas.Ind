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
      <div className="bg-deep-charcoal rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-102 glass-effect border border-matte-gold/20">
        <div className="relative overflow-hidden">
        <img src={product.images[0]} alt={product.name} className="w-full h-48 object-cover object-center rounded-t-lg" />
          {product.featured && (
            <div className="absolute top-4 left-4 bg-matte-gold text-rich-black px-3 py-1 rounded-full text-sm font-semibold">
              Featured
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-xl font-playfair text-matte-gold mb-2 truncate">{product.name}</h3>
          <p className="text-cream-white/70 text-sm mb-4 line-clamp-2">{product.description}</p>
          <div className="flex justify-between items-baseline mt-4">
            <span className="text-matte-gold font-bold text-2xl">${parseFloat(product.price).toFixed(2)}</span>
            <Button onClick={handleAddToCart} className="bg-matte-gold text-rich-black hover:bg-matte-gold/90 transition-colors duration-200">
              {isAdding ? "Added!" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
