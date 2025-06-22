import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@/types";
import { getProductImageUrl, getProductBrand } from "@/utils/productUtils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import { Star, Heart, Share2, Shield, Truck, RotateCcw } from "lucide-react";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rich-black to-deep-charcoal pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-700 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-700 rounded animate-pulse" />
              <div className="h-6 bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-12 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rich-black to-deep-charcoal pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <p className="text-gray-400">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rich-black to-deep-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="aspect-square rounded-2xl overflow-hidden glass-effect">
              <img
                src={
                  (Array.isArray(product.images) && product.images[selectedImageIndex])
                    ? (typeof product.images[selectedImageIndex] === 'string' 
                        ? product.images[selectedImageIndex] 
                        : (product.images[selectedImageIndex] as any).url)
                    : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800"
                }
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {Array.isArray(product.images) && product.images.length > 0 ? product.images.map((image, index) => {
                const imageUrl = typeof image === 'string' ? image : (image as any).url;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index ? "border-matte-gold" : "border-transparent"
                    }`}
                  >
                    <img 
                      src={imageUrl} 
                      alt={`${product.name} ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </button>
                );
              }) : (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square glass-effect rounded-lg" />
                ))
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div>
              <h1 className="font-playfair text-4xl font-bold mb-2">{product.name}</h1>
              <p className="text-xl text-matte-gold">{product.brand}</p>
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold">
                  ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                </span>
                {product.compareAtPrice && (
                  <span className="text-gray-400 line-through">
                    ${typeof product.compareAtPrice === 'number' ? product.compareAtPrice.toFixed(2) : '0.00'}
                  </span>
                )}
              </div>
              <span className="text-gray-400">(127 reviews)</span>
            </div>

            <p className="text-gray-300 text-lg leading-relaxed">{product.description}</p>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-lg">Quantity:</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 py-2 text-lg hover:bg-gray-800 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-4 py-2">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-4 py-2 text-lg hover:bg-gray-800 transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <Button
                  onClick={() => {
                    if (product) {
                      addItem(product, quantity);
                    }
                  }}
                  disabled={!product}
                  className="bg-matte-gold text-rich-black hover:bg-matte-gold/90 flex-1 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Cart
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button variant="outline" size="icon" className="border-matte-gold/20 hover:border-matte-gold">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="border-matte-gold/20 hover:border-matte-gold">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-6 border-t border-matte-gold/20">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-matte-gold" />
                <span>Authenticity Guarantee</span>
              </div>
              <div className="flex items-center space-x-3">
                <Truck className="w-6 h-6 text-matte-gold" />
                <span>Free Express Shipping</span>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-6 h-6 text-matte-gold" />
                <span>30-Day Return Policy</span>
              </div>
            </div>

            {/* Product Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="pt-6 border-t border-matte-gold/20">
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-matte-gold/10 text-matte-gold rounded-full text-sm border border-matte-gold/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
