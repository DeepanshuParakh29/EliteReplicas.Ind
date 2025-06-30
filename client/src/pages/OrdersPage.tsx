import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { formatPrice } from '@/utils/currency';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
}

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [_, navigate] = useLocation();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !db) return;

      try {
        const dbInstance = db; // Use the non-null assertion since we checked it above
        const ordersRef = collection(dbInstance, 'orders');
        const q = query(
          ordersRef,
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];

        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'secondary';
      case 'shipped':
        return 'default';
      case 'processing':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Orders</h1>
        <Button onClick={() => navigate('/')}>Continue Shopping</Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">No orders found</h2>
          <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
          <Button onClick={() => navigate('/')}>Browse Products</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.id.substring(0, 8).toUpperCase()}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {order.createdAt ? format(order.createdAt, 'MMMM d, yyyy h:mm a') : 'Date not available'}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      order.status === 'delivered' ? 'secondary' : 
                      order.status === 'shipped' ? 'default' :
                      'outline'
                    }
                    className="capitalize"
                  >
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {order.items.map((item, index) => (
                    <div key={index} className="p-4 flex justify-between items-center">
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
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </div>
                <div className="text-lg font-semibold">
                  Total: {formatPrice(order.total)}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
