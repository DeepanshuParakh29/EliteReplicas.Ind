import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Product, User, Order } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Plus,
  Crown,
  Settings
} from "lucide-react";
import { useState } from "react";
import AddProductModal from "../components/AddProductModal";

export default function Admin() {
  const { user } = useAuth();
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Check if user has admin privileges
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rich-black to-deep-charcoal pt-20 flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  const { data: stats } = useQuery<{ totalSales: number; totalOrders: number; totalProducts: number; totalUsers: number }>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => fetch("/api/admin/stats").then((res) => res.json()),
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
    queryFn: () => fetch("/api/admin/products").then((res) => res.json()),
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: () => fetch("/api/admin/orders").then((res) => res.json()),
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users").then((res) => res.json()),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-rich-black to-deep-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-playfair text-4xl font-bold mb-2">
                Admin <span className="text-matte-gold">Dashboard</span>
              </h1>
              <p className="text-gray-400">Manage your luxury replica store</p>
            </div>
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-matte-gold" />
              <span className="text-matte-gold font-semibold capitalize">{user.role}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400">Total Sales</h3>
                  <DollarSign className="w-6 h-6 text-matte-gold" />
                </div>
                <p className="text-3xl font-bold text-matte-gold">${stats?.totalSales?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "-"}</p>
                <p className="text-green-400 text-sm">+12% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400">Orders</h3>
                  <ShoppingCart className="w-6 h-6 text-matte-gold" />
                </div>
                <p className="text-3xl font-bold text-matte-gold">{stats?.totalOrders ?? orders?.length ?? 0}</p>
                <p className="text-green-400 text-sm">+8% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400">Products</h3>
                  <Package className="w-6 h-6 text-matte-gold" />
                </div>
                <p className="text-3xl font-bold text-matte-gold">{stats?.totalProducts ?? products?.length ?? 0}</p>
                <p className="text-blue-400 text-sm">5 new this week</p>
              </CardContent>
            </Card>

            <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400">Users</h3>
                  <Users className="w-6 h-6 text-matte-gold" />
                </div>
                <p className="text-3xl font-bold text-matte-gold">{stats?.totalUsers ?? users?.length ?? 0}</p>
                <p className="text-green-400 text-sm">+15% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-deep-charcoal border border-matte-gold/20">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-matte-gold data-[state=active]:text-rich-black">
                <BarChart className="w-4 h-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-matte-gold data-[state=active]:text-rich-black">
                <Package className="w-4 h-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-matte-gold data-[state=active]:text-rich-black">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-matte-gold data-[state=active]:text-rich-black">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              {user.role === "super_admin" && (
                <TabsTrigger value="settings" className="data-[state=active]:bg-matte-gold data-[state=active]:text-rich-black">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
                <CardHeader>
                  <CardTitle className="text-matte-gold">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-rich-black rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <div>
                              <p className="font-semibold">#{order.id}</p>
                              <p className="text-gray-400 text-sm">
                                {order.items.length} item(s) • {order.status}
                              </p>
                            </div>
                          </div>
                          <span className="text-matte-gold font-semibold">${order.total}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No orders yet</p>
                    </div>
                  )
                }
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <h2 className="text-2xl font-bold">User Management</h2>
              <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
                <CardContent className="p-6">
                  {users && users.length > 0 ? (
                    <div className="space-y-4">
                      {users.map((userData) => (
                        <div key={userData.id} className="flex items-center justify-between p-4 bg-rich-black rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-matte-gold rounded-full flex items-center justify-center">
                              <span className="text-rich-black font-semibold">
                                {userData.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold">{userData.name}</p>
                              <p className="text-gray-400 text-sm">{userData.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="capitalize text-matte-gold">{userData.role}</span>
                            <span className="text-gray-400 text-sm">
                              {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No users found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <AddProductModal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} />

            <TabsContent value="products" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Product Management</h2>
                <Button
                  className="bg-matte-gold text-rich-black hover:bg-yellow-500"
                  onClick={() => setIsAddProductModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
              <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
                <CardContent className="p-6">
                  {products && products.length > 0 ? (
                    <div className="space-y-4">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-4 bg-rich-black rounded-lg">
                          <div className="flex items-center space-x-4">
                            <img
                              src={product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-gray-400 text-sm">{product.brand} • {product.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-matte-gold font-semibold">${product.price}</span>
                            <span className="text-gray-400">Stock: {product.stock}</span>
                            <Button size="sm" variant="outline" className="border-matte-gold/20">
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No products added yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <h2 className="text-2xl font-bold">Order Management</h2>
              <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Order management features coming soon</p>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>



            {user.role === "super_admin" && (
              <TabsContent value="settings" className="space-y-6">
                <h2 className="text-2xl font-bold">Super Admin Settings</h2>
                <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
                  <CardHeader>
                    <CardTitle className="text-matte-gold">System Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-rich-black rounded-lg">
                      <div>
                        <h3 className="font-semibold">Maintenance Mode</h3>
                        <p className="text-gray-400 text-sm">Enable to prevent user access</p>
                      </div>
                      <Button variant="outline" className="border-matte-gold/20">
                        Toggle
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-rich-black rounded-lg">
                      <div>
                        <h3 className="font-semibold">User Registration</h3>
                        <p className="text-gray-400 text-sm">Allow new user registrations</p>
                      </div>
                      <Button variant="outline" className="border-matte-gold/20">
                        Enabled
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>

 
        <AddProductModal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} />
      </div>
    </div>
  );
}
