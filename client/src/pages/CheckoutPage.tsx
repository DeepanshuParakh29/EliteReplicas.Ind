import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { CartItem, useCart } from '@/context/CartContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { formatPrice } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [_, navigate] = useLocation();
  
  const validateAddress = () => {
    type AddressField = keyof typeof address;
    const requiredFields: AddressField[] = ['line1', 'city', 'state', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !address[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Please fill in all required address fields: ${missingFields.join(', ')}`);
    }
    
    return true;
  };
  
  // Type guard to check if db is available
  const getFirestore = () => {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    return db;
  };

  useEffect(() => {
    if (!user) return;
    
    const loadUserAddress = async () => {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists() && userDoc.data().shippingAddress) {
          setAddress(prev => ({
            ...prev,
            ...userDoc.data().shippingAddress
          }));
        }
      } catch (error) {
        console.error('Error loading user address:', error);
      }
    };

    loadUserAddress();
  }, [user]);

  // Handle input changes with proper type safety
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Alias for backward compatibility with existing code
  const handleAddressChange = handleInputChange;
  
  // Calculate total price of all items in cart
  const calculateTotal = (): number => {
    return cartItems.reduce((total: number, item: CartItem) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
      const quantity = item.quantity || 0;
      return total + (isNaN(price) ? 0 : price * quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    try {
      // Validate address and cart
      validateAddress();
      
      if (cartItems.length === 0) {
        throw new Error('Your cart is empty');
      }

      setLoading(true);
      
      const dbInstance = getFirestore();
      
      // Prepare order items with proper types
      const orderItems = cartItems.map((item: CartItem) => ({
        productId: item.id,
        name: item.name,
        price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
        quantity: item.quantity || 1,
        image: item.image || ''
      }));
      
      // Calculate total with proper type safety
      const orderTotal = orderItems.reduce<number>(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      // Create order data with all required fields
      const orderData = {
        userId: user.id,
        userEmail: user.email || '',
        items: orderItems,
        shippingAddress: {
          line1: address.line1.trim(),
          line2: address.line2?.trim() || null,
          city: address.city.trim(),
          state: address.state.trim(),
          postalCode: address.postalCode.trim(),
          country: address.country.trim()
        },
        status: 'pending',
        total: orderTotal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      console.log('Saving order:', orderData);

      // Save address to user profile
      await setDoc(
        doc(dbInstance, 'users', user.id),
        {
          shippingAddress: {
            ...orderData.shippingAddress,
            updatedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );
      
      // Save order to Firestore
      const ordersCollection = collection(dbInstance, 'orders');
      const orderRef = doc(ordersCollection);
      await setDoc(orderRef, orderData);

      // Clear cart
      clearCart();

      // Show success message
      toast({
        title: 'Order Placed!',
        description: 'Your order has been placed successfully.',
      });

      // Redirect to orders page
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'There was an error placing your order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="line1">Address Line 1</Label>
                    <Input
                      id="line1"
                      name="line1"
                      value={address.line1}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line2">Address Line 2 (Optional)</Label>
                    <Input
                      id="line2"
                      name="line2"
                      value={address.line2}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={address.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={address.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={address.postalCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={address.country}
                    disabled
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item: CartItem) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatPrice(
                        (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0)) * (item.quantity || 1)
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
