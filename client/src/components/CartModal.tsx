import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/context/CartContext";
import { formatPrice } from '@/utils/currency';


export default function CartModal() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, total, clearCart } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
          
          <motion.div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-deep-charcoal border-l border-matte-gold/20"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="p-6 border-b border-matte-gold/20">
              <div className="flex items-center justify-between">
                <h3 className="font-playfair text-2xl font-semibold">Shopping Cart</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-gray-400 mb-4">Your cart is empty</p>
                    <Button onClick={() => setIsOpen(false)}>Continue Shopping</Button>
                  </div>
                ) : (
                  <ul className="space-y-6">
                    {items.map((item: CartItem) => (
                      <li key={item.id} className="flex gap-4">
                        <div className="relative w-24 h-24 flex-shrink-0 bg-gray-800 rounded-md overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="font-medium">
                              {formatPrice((typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0) * (item.quantity || 1))}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center border border-gray-700 rounded-md">
                              <button
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                className="px-2 py-1 text-gray-400 hover:text-white"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-2">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, (item.quantity || 0) + 1)}
                                className="px-2 py-1 text-gray-400 hover:text-white"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Footer */}
              {items.length > 0 && (
                <div className="p-6 border-t border-matte-gold/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-matte-gold">${total.toFixed(2)}</span>
                  </div>
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-matte-gold text-rich-black hover:bg-yellow-500 py-4 text-lg neo-shadow"
                      onClick={() => {
                        setIsOpen(false);
                        window.location.href = '/checkout';
                      }}
                    >
                      Checkout
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={clearCart}
                      className="w-full text-gray-400 hover:text-white"
                    >
                      Clear Cart
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
