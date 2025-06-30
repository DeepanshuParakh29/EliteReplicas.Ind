import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useUploadImages } from "@/hooks/useUploadImages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addProduct } from "../services/product";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// How images will be handled
type UploadMode = "browser" | "url" | "none";

const AddProductModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, firebaseUser } = useAuth();

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
  const [uploadMode, setUploadMode] = useState<UploadMode>("browser");
  const uploadHook = useUploadImages({ user: firebaseUser }); // Pass the firebaseUser to the hook
  const [files, setFiles] = useState<File[]>([]);
  // State for tracking upload progress
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const urlRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!firebaseUser) throw new Error('User not authenticated');
      const token: string = await firebaseUser.getIdToken();
      
      // Format the data properly
      const productData = {
        name: data.name,
        price: parseFloat(data.price),
        description: data.description,
        category: data.category,
        brand: data.brand,
        stock: parseInt(data.stock) || 0,
        tags: data.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        featured: data.featured || false,
        active: data.active !== false, // default to true
        images: data.images || [],
      };

      return addProduct(productData, token);
    },
    onSuccess: () => {
      toast({ title: "Product added successfully" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      // Create preview URLs for selected images
      const newPreviewUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(newPreviewUrls);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploadingImages(true);
      setUploadError(null);
      
      // Validate required fields
      if (!name.trim()) {
        throw new Error('Product name is required');
      }
      if (!description.trim()) {
        throw new Error('Product description is required');
      }
      if (!category.trim()) {
        throw new Error('Category is required');
      }
      if (!brand.trim()) {
        throw new Error('Brand is required');
      }
      if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        throw new Error('Please enter a valid price');
      }
      
      let imageUrlsToUse = [...previewUrls];
      
      // Upload new images if any
      if (files.length > 0) {
        try {
          const uploadedUrls = await uploadHook.uploadImages(files);
          imageUrlsToUse = [...imageUrlsToUse, ...uploadedUrls];
        } catch (error) {
          console.error('Error uploading images:', error);
          toast({
            title: 'Error uploading images',
            description: error instanceof Error ? error.message : 'Failed to upload images',
            variant: 'destructive',
          });
          return;
        } finally {
          setUploadingImages(false);
        }
      }

      // Prepare product data
      const productData = {
        name,
        price: parseFloat(price),
        description,
        category,
        brand,
        stock: parseInt(stock) || 0,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        featured,
        active: true,
        images: imageUrlsToUse,
      };
      
      console.log('Submitting product:', productData);
      
      // Submit the product data
      await addMutation.mutateAsync(productData);
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      const errorMessage = err.message || 'Failed to add product';
      
      // Only show toast if we don't have a more specific upload error
      if (!uploadError) {
        toast({ 
          title: "Error", 
          description: errorMessage, 
          variant: "destructive" 
        });
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const reset = () => {
    setName("");
    setPrice("");
    setDescription("");
    setCategory("");
    setBrand("");
    setStock("");
    setTags("");
    setFeatured(false);
    setActive(true);
    setFiles([]);
    
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    
    if (urlRef.current) urlRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* basic fields */}
          <div className="grid gap-2 md:grid-cols-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input
              placeholder="Price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
            <Input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
            <Input placeholder="Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            <Input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <Textarea 
            placeholder="Description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          {/* flags */}
          <div className="flex items-center gap-4">
            <Checkbox id="featured" checked={featured} onCheckedChange={(v) => setFeatured(Boolean(v))} />
            <label htmlFor="featured">Featured</label>
            <Checkbox id="active" checked={active} onCheckedChange={(v) => setActive(Boolean(v))} />
            <label htmlFor="active">Active</label>
          </div>

          {/* upload mode selector */}
          <div className="flex gap-4">
            {[
              { mode: "browser", label: "Upload files" },
              { mode: "url", label: "Image URLs" },
              { mode: "none", label: "No images" },
            ].map((opt) => (
              <Button
                key={opt.mode}
                type="button"
                variant={uploadMode === opt.mode ? "default" : "outline"}
                onClick={() => setUploadMode(opt.mode as UploadMode)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {uploadMode === "browser" && (
            <div className="space-y-4">
              <Input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeFile(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {uploadMode === "url" && (
            <Textarea 
              ref={urlRef} 
              placeholder="One URL per line or comma-separated"
              className="min-h-[100px]"
            />
          )}

          <Button 
            type="submit" 
            disabled={addMutation.isPending || uploadingImages} 
            className="w-full flex items-center justify-center gap-2"
          >
            {addMutation.isPending || uploadingImages ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{uploadingImages ? 'Uploading images...' : 'Saving product...'}</span>
              </>
            ) : 'Add Product'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
