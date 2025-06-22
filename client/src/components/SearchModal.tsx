import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@/types";
import { getProductImageUrl, getProductBrand } from "@/utils/productUtils";
import { Link } from "wouter";

interface SearchModalProps {
  onClose: () => void;
}

export default function SearchModal({ onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/search", searchQuery],
    enabled: searchQuery.length >= 2,
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        <motion.div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        <motion.div 
          className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="bg-deep-charcoal rounded-2xl glass-effect p-6">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="search-input"
                name="searchQuery"
                type="text"
                placeholder="Search for luxury replicas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 py-4 bg-rich-black border-matte-gold/20 text-white placeholder-gray-400 focus:border-matte-gold text-lg"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {searchQuery.length >= 2 && (
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 p-3 rounded-lg animate-pulse">
                        <div className="w-12 h-12 bg-gray-600 rounded-lg" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-600 rounded mb-2" />
                          <div className="h-3 bg-gray-700 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((product) => (
                      <Link key={product.id} href={`/product/${product.id}`} onClick={onClose}>
                        <motion.div 
                          className="flex items-center space-x-4 p-3 hover:bg-white/5 rounded-lg cursor-pointer"
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img 
                            src={getProductImageUrl(product)} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg" 
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-gray-400 text-sm">
                              {getProductBrand(product)} • ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                            </p>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No products found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
            
            {searchQuery.length < 2 && searchQuery.length > 0 && (
              <div className="text-center py-4">
                <p className="text-gray-400">Type at least 2 characters to search</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
