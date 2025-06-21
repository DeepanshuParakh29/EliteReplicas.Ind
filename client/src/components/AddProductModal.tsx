import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addProduct } from "../services/product";
import { uploadImages } from "../hooks/useUploadImages";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// How images will be handled
type UploadMode = "browser" | "url" | "none";

const AddProductModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
  const [files, setFiles] = useState<File[]>([]);
  const urlRef = useRef<HTMLTextAreaElement>(null);

  const addMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      toast({ title: "Product added" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imageUrls: string[] = [];

      if (uploadMode === "browser") {
        imageUrls = await uploadImages(files);
      } else if (uploadMode === "url") {
        imageUrls = urlRef.current?.value
          .split(/\n|,/)
          .map((u) => u.trim())
          .filter(Boolean) || [];
      }

      const productData = {
        name,
        price: parseFloat(price || "0"),
        description,
        category,
        brand,
        stock: parseInt(stock || "0", 10),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        featured,
        active,
        images: imageUrls,
      };
      
      console.log('Submitting product:', productData);
      await addMutation.mutateAsync(productData);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
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
    if (urlRef.current) urlRef.current.value = "";
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
            <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
            <Input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
            <Input placeholder="Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            <Input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

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
            <Input type="file" accept="image/*" multiple onChange={handleFileChange} />
          )}
          {uploadMode === "url" && (
            <Textarea ref={urlRef} placeholder="One URL per line or comma-separated" />
          )}

          <Button type="submit" disabled={addMutation.isPending} className="w-full">
            {addMutation.isPending ? "Saving…" : "Add"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
