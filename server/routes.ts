import { IStorage, IFileStorage } from "./storage";
import { insertUserSchema, insertProductSchema, insertOrderSchema } from "@shared/schema";
import express, { Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
// @ts-ignore - node-fetch lacks built-in TS types for ESM default import
import fetch from 'node-fetch';

// Polyfill global fetch for Node versions that do not have it natively
if (!(globalThis as any).fetch) {
  (globalThis as any).fetch = fetch as any;
}

export default function (storage: IStorage, fileStorage: IFileStorage) {
  const app = express();

  // Middleware to parse JSON and URL-encoded data
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

// User routes
app.get("/api/users/firebase/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(userData);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid user data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
});

// Product routes
app.get("/api/products", async (req, res) => {
  try {
    const { search, category, sortBy } = req.query;
    const products = await storage.getProducts({
      search: search as string,
      category: category as string,
      sortBy: sortBy as string,
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

app.get("/api/products/featured", async (req, res) => {
  try {
    const products = await storage.getFeaturedProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch featured products" });
  }
});

app.get("/api/products/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string" || query.length < 2) {
      return res.json([]);
    }
    
    const products = await storage.searchProducts(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to search products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/products", async (req, res) => {
  try {
    const productData = req.body; // Do not parse yet

    const productToCreate = {
      ...productData,
    };
    console.log("Product data before Zod parsing:", productToCreate);

    // Now parse with the schema
    try {
      const parsedProductData = insertProductSchema.parse(productToCreate);
      const product = await storage.createProduct(parsedProductData);
      res.json(product);
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.error("Zod validation error during product creation:", zodError.errors);
        return res.status(400).json({ message: "Invalid product data", errors: zodError.errors });
      } else {
        throw zodError; // Re-throw if it's not a ZodError to be caught by the outer catch
      }
    }
  } catch (error) {
    console.error("Error creating product:", error); // Log the full error object
    res.status(500).json({ message: "Error creating product", details: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/api/products/generate-upload-url", async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ message: "Filename and content type are required." });
    }
    const destination = `product-images/${Date.now()}-${filename}`;
    const signedUrl = await fileStorage.getSignedUrlForUpload(destination, contentType);
    res.json({ signedUrl, filePath: destination });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).json({ message: "Failed to generate upload URL", details: error instanceof Error ? error.message : String(error) });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const productData = insertProductSchema.partial().parse(req.body);
    const updatedProduct = await storage.updateProduct(id, productData);
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid product data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const success = await storage.deleteProduct(id);
    if (!success) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// Order routes
app.post("/api/orders", async (req, res) => {
  try {
    const orderData = insertOrderSchema.parse(req.body);
    const order = await storage.createOrder(orderData);
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid order data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create order" });
  }
});

app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Missing status" });
    }
    const updatedOrder = await storage.updateOrderStatus(id, status);
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// Cart routes
app.post("/api/cart", async (req, res) => {
  try {
    const cartItemData = req.body;
    const cartItem = await storage.addToCart(cartItemData);
    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to add item to cart" });
  }
});

app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const cartItems = await storage.getCartItems(userId);
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cart items" });
  }
});

app.put("/api/cart/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ message: "Quantity must be a non-negative number" });
    }
    const updatedCartItem = await storage.updateCartItem(id, quantity);
    if (!updatedCartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.json(updatedCartItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to update cart item" });
  }
});

app.delete("/api/cart/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const success = await storage.removeFromCart(id);
    if (!success) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.json({ message: "Cart item removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove cart item" });
  }
});

app.delete("/api/cart/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const success = await storage.clearCart(userId);
    if (!success) {
      return res.status(404).json({ message: "Cart not found for user" });
    }
    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

// Admin routes
// Admin - Products
app.get("/api/admin/products", async (_req: Request, res: Response) => {
  try {
    const products = await storage.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error("Failed to fetch admin products:", error);
    res.status(500).json({ message: "Failed to fetch admin products" });
  }
});

// Admin - Orders
app.get("/api/admin/orders", async (_req: Request, res: Response) => {
  try {
    const orders = await storage.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);
    res.status(500).json({ message: "Failed to fetch admin orders" });
  }
});

// Existing Admin routes
app.get("/api/admin/stats", async (req, res) => {
  try {
    const stats = await storage.getAdminStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
});

app.get("/api/admin/users", async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin users" });
  }
});

// File Upload route
app.post("/api/upload", async (req: Request, res: Response) => {
  try {
    // Configure multer for file uploads
    const uploadMiddleware = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (_req, file, cb) => {
        // Accept images only
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
          return cb(new Error('Only image files are allowed!'));
        }
        cb(null, true);
      },
    }).single('image');

    // Handle the file upload
    uploadMiddleware(req as any, res as any, async (err: unknown) => {
      if (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error uploading file';
        return res.status(400).json({ 
          success: false, 
          message: errorMessage
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No file uploaded" 
        });
      }

      const file = req.file;
      const uniqueFilename = `${Date.now()}-${file.originalname}`;
      const filePath = `product-images/${uniqueFilename}`;

      try {
        // Get a signed URL for upload
        // Directly upload the buffer via the admin SDK
        const fileUrl = await fileStorage.uploadBuffer(filePath, file.buffer, file.mimetype);

        res.json({ 
          success: true, 
          filePath,
          fileUrl,
          message: 'File uploaded successfully' 
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ 
          success: false, 
          message: error instanceof Error ? error.message : 'Failed to upload file' 
        });
      }
    });
  } catch (error) {
    console.error('File upload failed:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

app.delete("/api/files", async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ message: "Missing file path." });
    }
    await fileStorage.deleteFile(filePath);
    res.json({ message: "File deleted successfully." });
  } catch (error) {
    console.error("File deletion failed:", error);
    res.status(500).json({ message: "Failed to delete file" });
  }
});

// Export the app
return app;
}