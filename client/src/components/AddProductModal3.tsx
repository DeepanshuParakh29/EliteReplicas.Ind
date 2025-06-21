import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addProduct } from '../services/product';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { useToast } from '@/components/ui/use-toast';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('');
  const [tags, setTags] = useState('');
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);

  const queryClient = useQueryClient();

  const { toast } = useToast();

  const addProductMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
      setProductName('');
      setPrice('');
      setDescription('');
      setImage(null);
      setImagePath(null);
      setCategory('');
      setBrand('');
      setStock('');
      setTags('');
      setFeatured(false);
      setActive(true);
      toast({
        title: 'Product added successfully!',
        description: 'The product has been added to your inventory.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add product',
        description: error.message,
        variant: 'destructive',
      });
      console.error('Failed to add product:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      toast({
        title: 'Image Missing',
        description: 'Please select an image for the product.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 1. Create FormData to send the file
      const formData = new FormData();
      formData.append('image', image);
      formData.append('filename', `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.]/g, '-')}`);
      formData.append('contentType', image.type);

      // 2. Upload the file through your backend
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it with the correct boundary
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const { filePath } = await uploadResponse.json();
      setImagePath(filePath);

      // 3. Proceed with product creation, passing the image path
      const productData = {
        name: productName,
        price: parseFloat(price),
        description,
        category,
        brand,
        stock: parseInt(stock, 10),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        featured,
        active,
        images: [filePath],
      };

      await addProductMutation.mutateAsync(productData);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error during product creation:', error);
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-screen overflow-y-auto" aria-describedby="add-product-desc">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription id="add-product-desc">
            Fill in details to add a new product to the store.
          </DialogDescription>
        </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Product Name</label>
          <Input
            id="productName"
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
            required
            step="0.01"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <Textarea
            id="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <Input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Brand</label>
          <Input
            id="brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
          <Input
            id="stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            min="0"
          />
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
          <Input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., electronics, gadgets, new"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured"
            checked={featured}
            onCheckedChange={(checked: boolean) => setFeatured(checked)}
          />
          <label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured Product</label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="active"
            checked={active}
            onCheckedChange={(checked: boolean) => setActive(checked)}
          />
          <label htmlFor="active" className="text-sm font-medium text-gray-700">Active Product</label>
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">Product Image</label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
            required
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={addProductMutation.isPending}>
            {addProductMutation.isPending ? 'Adding...' : 'Add Product'}
          </Button>
        </div>
      </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;