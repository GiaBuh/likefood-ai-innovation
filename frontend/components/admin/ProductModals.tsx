
import React, { useState, useRef, useEffect } from 'react';
import { Category, Product, ProductVariant } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryManagementModalProps extends ModalProps {
  categories: Category[];
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

interface ProductModalProps extends ModalProps {
  product?: Product | null; // If provided, we are in Edit mode
  categories?: Category[];
  onSave?: (product: Product) => Promise<void> | void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewName('');
      setEditingId(null);
      setEditingName('');
      setError(null);
    }
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddCategory(name);
      setNewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm danh mục.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onUpdateCategory(id, name);
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật danh mục.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onDeleteCategory(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa danh mục.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-surface-light dark:bg-surface-dark shadow-xl border border-border-light dark:border-border-dark">
        <div className="flex-none flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
          <h3 className="text-xl font-bold text-text-light dark:text-text-dark">Category Management</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-subtext-light hover:text-text-light dark:text-subtext-dark dark:hover:text-text-dark hover:bg-background-light dark:hover:bg-background-dark"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add form */}
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 h-11 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 text-sm text-text-light dark:text-text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="New category name (e.g. Snacks, Beverages)"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="h-11 px-6 rounded-lg bg-primary font-bold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </form>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Category list */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-text-light dark:text-text-dark">
              List ({categories.length})
            </h4>
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="py-8 text-center text-subtext-light dark:text-subtext-dark">
                  No categories yet. Add a new category above.
                </p>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark"
                  >
                    {editingId === cat.id ? (
                      <>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 h-10 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 text-sm"
                          placeholder="Category name"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          disabled={isSubmitting || !editingName.trim()}
                          className="h-10 px-4 rounded-lg bg-primary text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                          className="h-10 px-4 rounded-lg border border-border-light dark:border-border-dark text-sm hover:bg-background-light dark:hover:bg-background-dark"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-medium text-text-light dark:text-text-dark">{cat.name}</span>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat.id, cat.name)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg text-subtext-light hover:text-primary hover:bg-primary/10"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg text-subtext-light hover:text-red-500 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductFormModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, categories = [], onSave }) => {
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  const MAX_GALLERY_IMAGES = 8;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  
  // Variant State
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Reset or Populate form when opening
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setName(product.name);
        setCategory(product.categoryName || '');
        setDescription(product.description);
        
        // Handle images
        setImagePreview(product.thumbnail || null);
        
        // If product has images array, use items after index 0 as gallery (assuming index 0 is thumbnail)
        if (product.images && product.images.length > 0) {
           const gallery = product.images.filter(img => img !== product.thumbnail);
           setGalleryImages(gallery);
        } else {
           setGalleryImages([]);
        }

        setVariants([...product.variants]);
      } else {
        // Reset for new product
        setName('');
        setCategory('');
        setDescription('');
        setImagePreview(null);
        setGalleryImages([]);
        setVariants([
          { id: Date.now().toString(), weight: '0g', weightValue: 0, weightUnit: 'g', sku: '', price: 0, quantity: 0 }
        ]);
      }
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      const finalThumbnail = imagePreview || 'https://via.placeholder.com/150';
      const allImages = [finalThumbnail, ...galleryImages];
      const selectedCategory = categories.find((item) => item.name === category);

      const productData: Product = {
        id: product?.id || '',
        name,
        categoryName: category,
        category: category,
        categoryId: selectedCategory?.id,
        description,
        thumbnail: finalThumbnail,
        image: finalThumbnail,
        images: allImages,
        variants,
        price: variants.length > 0 ? variants[0].price : 0,
        weight: variants.length > 0 ? variants[0].weight : '0g',
        packaging: 'Standard',
        isUsShip: true,
        location: 'Warehouse',
        status: product?.status || 'Active'
      };
      try {
        await onSave(productData);
      } catch (error) {
        console.error('Save product failed', error);
        alert('Cannot save product. Please check data and try again.');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed.');
        e.target.value = '';
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        alert(`Thumbnail is too large. Max size is ${MAX_IMAGE_SIZE_MB}MB.`);
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remainingSlots = MAX_GALLERY_IMAGES - galleryImages.length;
      if (remainingSlots <= 0) {
        alert(`You can upload up to ${MAX_GALLERY_IMAGES} gallery images.`);
        e.target.value = '';
        return;
      }

      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const rejectedBySize = selectedFiles.filter((file) => file.size > MAX_IMAGE_SIZE_BYTES);
      const rejectedByType = selectedFiles.filter((file) => !file.type.startsWith('image/'));
      if (rejectedByType.length > 0) {
        alert('Some files were skipped because they are not images.');
      }
      if (rejectedBySize.length > 0) {
        alert(`Some files were skipped because they exceed ${MAX_IMAGE_SIZE_MB}MB.`);
      }

      const validFiles = selectedFiles.filter(
        (file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE_BYTES
      );
      if (validFiles.length === 0) {
        e.target.value = '';
        return;
      }

      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setGalleryImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setGalleryImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    if (field === 'weightValue' || field === 'weightUnit') {
       const val = field === 'weightValue' ? value : newVariants[index].weightValue;
       const unit = field === 'weightUnit' ? value : newVariants[index].weightUnit;
       newVariants[index].weight = `${val}${unit}`;
    }
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      { id: Date.now().toString(), weight: '0g', weightValue: 0, weightUnit: 'g', sku: '', price: 0, quantity: 0 }
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-surface-light dark:bg-surface-dark p-6 shadow-xl border border-border-light dark:border-border-dark my-auto">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-text-light dark:text-text-dark">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={onClose} className="text-subtext-light hover:text-text-light dark:text-subtext-dark dark:hover:text-text-dark">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: Images (Thumbnail + Gallery) - MOVED TO TOP */}
          <div>
             <div className="flex flex-col md:flex-row gap-6">
                {/* Thumbnail Upload - Increased width to ~33% (w-1/3) */}
                <div className="w-full md:w-1/3 flex-shrink-0">
                    <label className="text-xs font-medium text-subtext-light dark:text-subtext-dark mb-2 block">Thumbnail</label>
                    <div 
                      className="relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:border-primary transition-colors overflow-hidden group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-white text-3xl">edit</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-subtext-light dark:text-subtext-dark p-4 text-center">
                          <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                          <span className="text-[10px] font-medium">Upload</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                </div>

                {/* Gallery Upload */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-subtext-light dark:text-subtext-dark">Gallery Images</label>
                        <button 
                            type="button" 
                            onClick={() => galleryInputRef.current?.click()}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                            Add More
                        </button>
                        <input 
                            type="file" 
                            ref={galleryInputRef} 
                            className="hidden" 
                            accept="image/*"
                            multiple 
                            onChange={handleGalleryUpload}
                        />
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                        {galleryImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border-light dark:border-border-dark group">
                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => removeGalleryImage(idx)}
                                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <span className="material-symbols-outlined text-[10px]">close</span>
                                </button>
                            </div>
                        ))}
                        {/* Empty State / Add Button for Grid */}
                        <div 
                            onClick={() => galleryInputRef.current?.click()}
                            className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark hover:border-primary transition-colors text-subtext-light dark:text-subtext-dark"
                        >
                            <span className="material-symbols-outlined text-xl">add</span>
                        </div>
                    </div>
                </div>
             </div>
          </div>

          <div className="border-t border-border-light dark:border-border-dark my-2"></div>

          {/* Row 2: Product Name (Full Width) */}
          <div>
              <label className="mb-1.5 block text-sm font-medium text-text-light dark:text-text-dark">Product Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 text-sm text-text-light dark:text-text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" 
                placeholder="e.g. Pho Bo Kit" 
                required 
              />
          </div>

          {/* Row 3: Category */}
          <div>
              <label className="mb-1.5 block text-sm font-medium text-text-light dark:text-text-dark">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 text-sm text-text-light dark:text-text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select Category</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-light dark:text-text-dark">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24 w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-4 text-sm text-text-light dark:text-text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none" 
              placeholder="Enter product description..."
            ></textarea>
          </div>

          {/* Row 5: Variants */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border-light dark:border-border-dark pb-2">
              <h4 className="text-sm font-bold text-text-light dark:text-text-dark uppercase">Product Variants</h4>
              <button 
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:text-blue-600 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Variant
              </button>
            </div>
            
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 rounded-xl bg-background-light/50 dark:bg-background-dark/50 border border-border-light dark:border-border-dark">
                    <div className="col-span-3">
                        <label className="mb-1 block text-xs font-medium text-subtext-light dark:text-subtext-dark">SKU</label>
                        <input 
                          type="text" 
                          value={variant.sku ?? ''}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                          className="h-9 w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 text-sm font-mono focus:border-primary focus:outline-none" 
                          placeholder="e.g. PHO-500G" 
                          required 
                        />
                    </div>
                    <div className="col-span-3">
                        <label className="mb-1 block text-xs font-medium text-subtext-light dark:text-subtext-dark">Weight</label>
                        <div className="flex">
                          <input 
                              type="number" 
                              value={variant.weightValue}
                              onChange={(e) => handleVariantChange(index, 'weightValue', Number(e.target.value))}
                              className="h-9 w-full rounded-l-lg border border-r-0 border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 text-sm focus:border-primary focus:outline-none" 
                              placeholder="0" 
                          />
                          <select 
                              value={variant.weightUnit}
                              onChange={(e) => handleVariantChange(index, 'weightUnit', e.target.value)}
                              className="h-9 w-20 rounded-r-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-2 text-sm focus:border-primary focus:outline-none bg-gray-50 dark:bg-gray-800"
                          >
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="ml">ml</option>
                              <option value="l">l</option>
                          </select>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label className="mb-1 block text-xs font-medium text-subtext-light dark:text-subtext-dark">Price ($)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={variant.price}
                          onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                          className="h-9 w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 text-sm focus:border-primary focus:outline-none" 
                          placeholder="0.00" 
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="mb-1 block text-xs font-medium text-subtext-light dark:text-subtext-dark">Stock</label>
                        <input 
                          type="number" 
                          value={variant.quantity}
                          onChange={(e) => handleVariantChange(index, 'quantity', Number(e.target.value))}
                          className="h-9 w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 text-sm focus:border-primary focus:outline-none" 
                          placeholder="0" 
                        />
                    </div>
                    <div className="col-span-2 flex justify-end pb-1">
                        {variants.length > 1 && (
                            <button 
                                type="button" 
                                onClick={() => removeVariant(index)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-subtext-light hover:bg-red-50 hover:text-red-600 dark:text-subtext-dark dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                                title="Remove Variant"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        )}
                    </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 border-t border-border-light dark:border-border-dark pt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="rounded-lg px-6 py-2.5 text-sm font-medium text-subtext-light hover:bg-background-light dark:text-subtext-dark dark:hover:bg-background-dark transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
