import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Product, User, Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Plus,
  Crown,
  Settings,
  AlertCircle,
  UserPlus,
  ServerCog,
  ShieldAlert,
  Database,
  LogOut,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import AddProductModal from "../components/AddProductModal";
import EditProductModal from "../components/EditProductModal";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Admin action types
type AdminAction = 'clearCache' | 'backupDatabase' | 'restartServer' | 'clearLogs' | 'migrateData';

export default function Admin() {
  const { user: authUser, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<Record<string, boolean>>({});
  const [serverStatus, setServerStatus] = useState({
    status: 'online',
    lastChecked: new Date().toISOString(),
  });

  // Admin settings
  const {
    settings,
    loading: settingsLoading,
    updating: settingsUpdating,
    toggleMaintenanceMode,
    toggleUserRegistration,
    refreshSettings,
  } = useAdminSettings();
  
  // Handle user registration toggle
  const handleUserRegistrationToggle = async () => {
    try {
      const newUserRegistration = !settings.userRegistration;
      await toggleUserRegistration(newUserRegistration);
      await refreshSettings();
    } catch (error) {
      console.error('Failed to update user registration:', error);
    }
  };

  // Toggle maintenance mode
  const handleToggleMaintenance = async () => {
    try {
      const newMaintenanceMode = !settings.maintenanceMode;
      await toggleMaintenanceMode(newMaintenanceMode);
      await checkServerStatus();
      await refreshSettings();
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
    }
  };

  const { firebaseUser } = useAuth();

  // Server status check
  const checkServerStatus = async () => {
    try {
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }
      
      const idToken = await firebaseUser.getIdToken();
      
      const response = await fetch('/api/health', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        throw new Error(`Server responded with non-JSON: ${response.status} ${response.statusText}. Response: ${text.substring(0, 200)}...`);
      }
      
      setServerStatus({
        status: data.status === 'ok' ? 'online' : 'offline',
        lastChecked: new Date().toISOString(),
      });
      return data.status === 'ok';
    } catch (error) {
      console.error('Error checking server status:', error);
      setServerStatus({
        status: 'offline',
        lastChecked: new Date().toISOString(),
      });
      return false;
    }
  };

  // Perform admin action
  const performAdminAction = async (action: AdminAction) => {
    if (!authUser) return;
    
    setIsActionLoading(prev => ({ ...prev, [action]: true }));
    
    try {
      const functions = getFunctions();
      let result;
      
      switch (action) {
        case 'clearCache':
          queryClient.invalidateQueries();
          toast({
            title: 'Success',
            description: 'Client cache cleared successfully',
          });
          break;
          
        case 'backupDatabase':
          const backupFn = httpsCallable(functions, 'createBackup');
          result = await backupFn({});
          toast({
            title: 'Success',
            description: 'Database backup created successfully',
          });
          break;
          
        case 'restartServer':
          await fetch('/api/admin/restart', { method: 'POST' });
          // Show toast after a delay to give server time to restart
          setTimeout(() => {
            toast({
              title: 'Server Restarting',
              description: 'The server is restarting. Please wait a moment...',
            });
          }, 1000);
          break;
          
        default:
          console.warn(`Action ${action} not implemented`);
      }
      
      // Refresh relevant data
      if (['clearCache', 'backupDatabase', 'migrateData'].includes(action)) {
        refreshSettings();
      }
      
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast({
        title: 'Error',
        description: `Failed to perform ${action}`,
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  // Check server status on mount and every 5 minutes
  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if user has admin privileges
  if (!authUser || (authUser.role !== "admin" && authUser.role !== "super_admin")) {
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
    queryFn: async () => {
      if (!firebaseUser) throw new Error('User not authenticated');
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
    queryFn: async () => {
      if (!firebaseUser) throw new Error('User not authenticated');
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      if (!firebaseUser) throw new Error('User not authenticated');
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      if (!firebaseUser) throw new Error('User not authenticated');
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
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
              <span className="text-matte-gold font-semibold capitalize">{authUser.role}</span>
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
              {authUser.role === "super_admin" && (
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
                                {userData.firstName?.charAt(0).toUpperCase() || userData.email?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold">
                                {userData.firstName && userData.lastName 
                                  ? `${userData.firstName} ${userData.lastName}`
                                  : userData.email?.split('@')[0] || 'User'}
                              </p>
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
                              src={product.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
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
                            <span className="text-gray-400">Stock: {product.stock || 0}</span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-matte-gold/20"
                              onClick={() => setEditingProduct(product)}
                            >
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



            {authUser?.role === "super_admin" && (
              <TabsContent value="settings" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Super Admin Settings</h2>
                    <p className="text-gray-400">Manage system-wide configurations and actions</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => performAdminAction('clearCache')}
                      disabled={isActionLoading['clearCache']}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isActionLoading['clearCache'] ? 'animate-spin' : ''}`} />
                      Clear Cache
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => checkServerStatus()}
                      disabled={isActionLoading['checkStatus']}
                    >
                      <ServerCog className="w-4 h-4 mr-2" />
                      Check Status
                    </Button>
                  </div>
                </div>

                {/* System Status */}
                <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
                  <CardHeader>
                    <CardTitle className="text-matte-gold flex items-center">
                      <ServerCog className="w-5 h-5 mr-2" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-rich-black rounded-lg">
                      <div>
                        <h3 className="font-semibold flex items-center">
                          Server Status
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            serverStatus.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {serverStatus.status.toUpperCase()}
                          </span>
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Last checked: {new Date(serverStatus.lastChecked).toLocaleString()}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => performAdminAction('restartServer')}
                        disabled={isActionLoading['restartServer']}
                      >
                        {isActionLoading['restartServer'] ? 'Restarting...' : 'Restart Server'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* System Configuration */}
                <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
                  <CardHeader>
                    <CardTitle className="text-matte-gold flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      System Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="bg-amber-900/20 border-amber-500/50">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <AlertDescription className="text-amber-200">
                        Changes to these settings affect all users. Use with caution.
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center justify-between p-4 bg-rich-black rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="maintenance-mode" className="flex items-center">
                          <ShieldAlert className="w-4 h-4 mr-2 text-amber-400" />
                          Maintenance Mode
                        </Label>
                        <p className="text-gray-400 text-sm">
                          Enable to prevent non-admin users from accessing the site
                        </p>
                      </div>
                      <Switch
                        id="maintenance-mode"
                        checked={settings?.maintenanceMode || false}
                        onCheckedChange={toggleMaintenanceMode}
                        disabled={settingsLoading || settingsUpdating}
                        className="data-[state=checked]:bg-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-rich-black rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="user-registration" className="flex items-center">
                          <UserPlus className="w-4 h-4 mr-2 text-blue-400" />
                          User Registration
                        </Label>
                        <p className="text-gray-400 text-sm">
                          Allow new users to create accounts
                        </p>
                      </div>
                      <Switch
                        id="user-registration"
                        checked={settings?.userRegistration !== false}
                        onCheckedChange={(checked) => toggleUserRegistration(checked)}
                        disabled={settingsLoading || settingsUpdating}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Database Management */}
                <Card className="bg-deep-charcoal border-matte-gold/20 glass-effect">
                  <CardHeader>
                    <CardTitle className="text-matte-gold flex items-center">
                      <Database className="w-5 h-5 mr-2" />
                      Database Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="justify-start text-left h-auto py-3"
                        onClick={() => performAdminAction('backupDatabase')}
                        disabled={isActionLoading['backupDatabase']}
                      >
                        <div className="flex items-center">
                          <Database className="w-4 h-4 mr-2 text-green-400" />
                          <div>
                            <p className="font-medium">Create Backup</p>
                            <p className="text-xs text-gray-400">Generate a full database backup</p>
                          </div>
                        </div>
                      </Button>

                      <Button 
                        variant="outline" 
                        className="justify-start text-left h-auto py-3"
                        onClick={() => performAdminAction('migrateData')}
                        disabled={isActionLoading['migrateData']}
                      >
                        <div className="flex items-center">
                          <RefreshCw className={`w-4 h-4 mr-2 text-blue-400 ${isActionLoading['migrateData'] ? 'animate-spin' : ''}`} />
                          <div>
                            <p className="font-medium">Run Migrations</p>
                            <p className="text-xs text-gray-400">Update database schema</p>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-deep-charcoal border-red-500/20 glass-effect">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-400/70">
                      These actions are irreversible. Proceed with caution.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-rich-black/50 border border-red-500/20 rounded-lg">
                      <div className="mb-4 sm:mb-0">
                        <h3 className="font-semibold text-red-400">Sign Out All Users</h3>
                        <p className="text-sm text-gray-400">Force all users to sign out immediately</p>
                      </div>
                      <Button variant="destructive" size="sm">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out All
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-rich-black/50 border border-red-500/20 rounded-lg">
                      <div className="mb-4 sm:mb-0">
                        <h3 className="font-semibold text-red-400">Delete All Data</h3>
                        <p className="text-sm text-gray-400">Permanently delete all data from the database</p>
                      </div>
                      <Button variant="destructive" size="sm">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Delete All Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>

 
        <AddProductModal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} />
        {editingProduct && (
          <EditProductModal 
            isOpen={!!editingProduct} 
            onClose={() => setEditingProduct(null)}
            product={editingProduct}
          />
        )}
      </div>
    </div>
  );
}
