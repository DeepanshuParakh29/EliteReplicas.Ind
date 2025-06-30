import React, { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProduct, ProductInput } from "../services/product";
import { useUploadImages } from "../hooks/useUploadImages";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, X } from "lucide-react";
import { Product, ProductImage } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

type UploadMode = "browser" | "url" | "none";

const EditProductModal: React.FC<Props> = ({ isOpen, onClose, product }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { firebaseUser } = useAuth();
  const { uploadImages } = useUploadImages({ user: firebaseUser });

  // product fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [stock, setStock] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);

  // images
  const [uploadMode, setUploadMode] = useState<UploadMode>("none");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const urlRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setDescription(product.description);
      setCategory(product.category);
      // Handle both string and ProductImage types for images
      const imageUrls = Array.isArray(product.images) 
        ? product.images.map((img: string | ProductImage) => 
            typeof img === 'string' ? img : (img as ProductImage).url
          )
        : [];
      setImageUrls(imageUrls);
      
      // Handle optional fields with defaults
      setBrand('brand' in product ? String(product.brand) : '');
      setStock('stock' in product ? String(product.stock || 0) : '0');
      setTags(Array.isArray(product.tags) ? product.tags.join(", ") : "");
      setFeatured(Boolean(product.isFeatured));
      setActive(product.isActive !== false);
    } else {
      // Reset form when no product is provided
      setName('');
      setPrice('');
      setDescription('');
      setCategory('');
      setBrand('');
      setStock('0');
      setTags('');
      setFeatured(false);
      setActive(true);
      setImageUrls([]);
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProductInput) => {
      if (!firebaseUser) throw new Error('User not authenticated');
      const token = await firebaseUser.getIdToken();
      if (!token) throw new Error('Failed to get authentication token');
      return updateProduct(product.id, data, token);
    },
    onSuccess: () => {
      toast({ title: "Product updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
      setPreviewUrls(newFiles.map(file => URL.createObjectURL(file)));
    }
  };

  const handleAddUrls = () => {
    if (urlRef.current?.value) {
      const urls = urlRef.current.value
        .split("\n")
        .map(url => url.trim())
        .filter(Boolean);
      setImageUrls(prev => [...prev, ...urls]);
      urlRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrlsToUse = [...imageUrls];
      
      // Upload new images if any
      if (files.length > 0) {
        setUploadingImages(true);
        try {
          const uploadedUrls = await uploadImages(files);
          imageUrlsToUse = [...imageUrls, ...uploadedUrls];
        } catch (error) {
          console.error('Error uploading images:', error);
          toast({
            title: 'Error uploading images',
            description: error instanceof Error ? error.message : 'Failed to upload images',
            variant: 'destructive',
          });
          return;
        }
      }

      const productData: ProductInput = {
        name,
        price: parseFloat(price),
        description,
        category,
        brand,
        stock: parseInt(stock) || 0,
        tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
        featured,
        active,
        images: imageUrlsToUse,
      };

      await updateMutation.mutateAsync(productData);
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setUploadingImages(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <Input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Category"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Brand"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={featured}
                    onCheckedChange={(checked) => setFeatured(checked === true)}
                  />
                  <label htmlFor="featured" className="text-sm">
                    Featured Product
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={active}
                    onCheckedChange={(checked) => setActive(checked === true)}
                  />
                  <label htmlFor="active" className="text-sm">
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product description"
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Product Images</label>
                
                {/* Image URLs */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="h-16 w-16 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Upload Options */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadMode(uploadMode === "browser" ? "none" : "browser")}
                    >
                      Upload Images
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadMode(uploadMode === "url" ? "none" : "url")}
                    >
                      Add Image URL
                    </Button>
                  </div>

                  {uploadMode === "browser" && (
                    <div>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select Files
                      </Button>
                      {previewUrls.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-gray-500">
                            {previewUrls.length} file(s) selected
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {previewUrls.map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="h-12 w-12 object-cover rounded"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {uploadMode === "url" && (
                    <div className="space-y-2">
                      <Textarea
                        ref={urlRef}
                        placeholder="Enter one image URL per line"
                        className="min-h-[60px]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddUrls}
                      >
                        Add URLs
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || uploadingImages}>
              {updateMutation.isPending || uploadingImages ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingImages ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;
