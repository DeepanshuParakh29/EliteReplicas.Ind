import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { User, Package, Heart, Settings } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rich-black to-deep-charcoal pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rich-black to-deep-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Profile Header */}
          <div className="glass-effect rounded-2xl p-8 mb-8">
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24 border-4 border-matte-gold">
                <AvatarImage src={user.avatar || ""} alt={user.name} />
                <AvatarFallback className="bg-matte-gold text-rich-black text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-playfair text-3xl font-bold mb-2">{user.name}</h1>
                <p className="text-matte-gold text-lg">{user.email}</p>
                <p className="text-gray-400 capitalize">{user.role} Member</p>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-deep-charcoal border border-matte-gold/20">
              <TabsTrigger value="profile" className="data-[state=active]:bg-matte-gold data-[state=active]:text-rich-black">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-matte-gold data-[state=active]:text-rich-black">
                <Package className="w-4 h-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="data-[state=active]:bg-matte-gold data-[state=active]:text-rich-black">
                <Heart className="w-4 h-4 mr-2" />
                Wishlist
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-matte-gold data-[state=active]:text-rich-black">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-deep-charcoal border-matte-gold/20">
                <CardHeader>
                  <CardTitle className="text-matte-gold">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        defaultValue={user.name}
                        className="bg-rich-black border-matte-gold/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        defaultValue={user.email}
                        disabled
                        className="bg-rich-black border-matte-gold/20"
                      />
                    </div>
                  </div>
                  <Button className="bg-matte-gold text-rich-black hover:bg-yellow-500">
                    Update Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Card className="bg-deep-charcoal border-matte-gold/20">
                <CardHeader>
                  <CardTitle className="text-matte-gold">Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <p className="text-gray-400 mb-4">Start shopping to see your orders here</p>
                    <Button className="bg-matte-gold text-rich-black hover:bg-yellow-500">
                      Browse Products
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wishlist" className="space-y-6">
              <Card className="bg-deep-charcoal border-matte-gold/20">
                <CardHeader>
                  <CardTitle className="text-matte-gold">Wishlist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No saved items</h3>
                    <p className="text-gray-400 mb-4">Save products you love to your wishlist</p>
                    <Button className="bg-matte-gold text-rich-black hover:bg-yellow-500">
                      Browse Products
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-deep-charcoal border-matte-gold/20">
                <CardHeader>
                  <CardTitle className="text-matte-gold">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Account Type</Label>
                    <p className="text-gray-300 capitalize">{user.role} Account</p>
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <p className="text-gray-300">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <Button variant="destructive" className="mt-4">
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
