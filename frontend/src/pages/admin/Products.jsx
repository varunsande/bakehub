import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    weightOptions: [{ weight: '½ kg', price: '' }],
    isEggless: false,
    hasEggOption: true,
    stock: 0,
    isActive: true,
    images: [],
    isPreOrder: false,
    preOrderAvailableDate: '',
    preOrderDeliveryDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get('/products?limit=100'),
        axios.get('/categories')
      ]);
      setProducts(productsRes.data.products || productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrls = [...formData.images];

      // Upload new images if any
      if (imageFiles.length > 0) {
        const formDataUpload = new FormData();
        imageFiles.forEach((file) => {
          formDataUpload.append('images', file);
        });

        const uploadRes = await axios.post('/upload/multiple', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        imageUrls = [...imageUrls, ...uploadRes.data.imageUrls];
      }

      const submitData = {
        ...formData,
        price: Number(formData.price),
        weightOptions: formData.weightOptions.map(w => ({
          weight: w.weight,
          price: Number(w.price)
        })),
        stock: Number(formData.stock),
        images: imageUrls
      };

      if (editingProduct) {
        await axios.put(`/products/${editingProduct._id}`, submitData);
        toast.success('Product updated');
      } else {
        await axios.post('/products', submitData);
        toast.success('Product created');
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category._id || product.category,
      price: product.price || '',
      weightOptions: product.weightOptions?.length > 0
        ? product.weightOptions
        : [{ weight: '½ kg', price: product.price || '' }],
      isEggless: product.isEggless || false,
      hasEggOption: product.hasEggOption !== false,
      stock: product.stock || 0,
      isActive: product.isActive !== false,
      images: product.images?.length > 0 ? product.images : [],
      isPreOrder: product.isPreOrder || false,
      preOrderAvailableDate: product.preOrderAvailableDate ? product.preOrderAvailableDate.slice(0, 10) : '',
      preOrderDeliveryDate: product.preOrderDeliveryDate ? product.preOrderDeliveryDate.slice(0, 10) : ''
    });
    setImageFiles([]);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      weightOptions: [{ weight: '½ kg', price: '' }],
      isEggless: false,
      hasEggOption: true,
      stock: 0,
      isActive: true,
      images: [],
      isPreOrder: false,
      preOrderAvailableDate: '',
      preOrderDeliveryDate: ''
    });
    setImageFiles([]);
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Limit to 10 total images (existing + new)
    const totalImages = formData.images.length + imageFiles.length;
    const remainingSlots = 10 - totalImages;
    
    if (remainingSlots <= 0) {
      toast.error('Maximum 10 images allowed per product');
      e.target.value = '';
      return;
    }
    
    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} image(s) added. Maximum 10 images per product.`);
    }
    
    setImageFiles([...imageFiles, ...filesToAdd]);
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
  };

  const removeExistingImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const replaceExistingImage = async (index, file) => {
    if (!file) return;
    
    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const uploadRes = await axios.post('/upload/single', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const newImages = [...formData.images];
      newImages[index] = uploadRes.data.imageUrl;
      setFormData({ ...formData, images: newImages });
      toast.success('Image replaced successfully');
    } catch (error) {
      console.error('Error replacing image:', error);
      toast.error('Failed to replace image');
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceImage = (index) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        replaceExistingImage(index, e.target.files[0]);
      }
    };
    input.click();
  };

  const addWeightOption = () => {
    setFormData({
      ...formData,
      weightOptions: [...formData.weightOptions, { weight: '1 kg', price: '' }]
    });
  };

  const updateWeightOption = (index, field, value) => {
    const updated = [...formData.weightOptions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, weightOptions: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Weight Options</label>
              {formData.weightOptions.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={option.weight}
                    onChange={(e) => updateWeightOption(index, 'weight', e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    <option value="½ kg">½ kg</option>
                    <option value="1 kg">1 kg</option>
                    <option value="1½ kg">1½ kg</option>
                    <option value="2 kg">2 kg</option>
                    <option value="2½ kg">2½ kg</option>
                    <option value="3 kg">3 kg</option>
                    <option value="3½ kg">3½ kg</option>
                    <option value="4 kg">4 kg</option>
                    <option value="4½ kg">4½ kg</option>
                    <option value="5 kg">5 kg</option>
                    <option value="5½ kg">5½ kg</option>
                    <option value="6 kg">6 kg</option>
                    <option value="6½ kg">6½ kg</option>
                    <option value="7 kg">7 kg</option>
                    <option value="7½ kg">7½ kg</option>
                    <option value="8 kg">8 kg</option>
                    <option value="8½ kg">8½ kg</option>
                    <option value="9 kg">9 kg</option>
                    <option value="9½ kg">9½ kg</option>
                    <option value="10 kg">10 kg</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Price"
                    value={option.price}
                    onChange={(e) => updateWeightOption(index, 'price', e.target.value)}
                    required
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addWeightOption}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                + Add Weight Option
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-2 pt-6">
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isEggless}
                      onChange={(e) => setFormData({ ...formData, isEggless: e.target.checked })}
                      className="mr-2"
                    />
                    Eggless
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasEggOption}
                      onChange={(e) => setFormData({ ...formData, hasEggOption: e.target.checked })}
                      className="mr-2"
                    />
                    Has Egg Option
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    Active
                  </label>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPreOrder}
                      onChange={(e) => setFormData({ ...formData, isPreOrder: e.target.checked })}
                      className="mr-2"
                    />
                    Pre-order
                  </label>
                  <label className="flex items-center gap-2">
                    <span>Pre-order Available Date:</span>
                    <input
                      type="date"
                      value={formData.preOrderAvailableDate}
                      onChange={(e) => setFormData({ ...formData, preOrderAvailableDate: e.target.value })}
                      className="px-2 py-1 border rounded"
                      disabled={!formData.isPreOrder}
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span>Pre-order Delivery Date:</span>
                    <input
                      type="date"
                      value={formData.preOrderDeliveryDate}
                      onChange={(e) => setFormData({ ...formData, preOrderDeliveryDate: e.target.value })}
                      className="px-2 py-1 border rounded"
                      disabled={!formData.isPreOrder}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Product Images</label>
              <div className="mb-3">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  id="product-images-input"
                />
                <p className="text-xs text-gray-500 mt-1">You can select multiple images (max 10 images per product)</p>
              </div>
              
              {/* All Images Grid - Existing + New */}
              {(formData.images.length > 0 || imageFiles.length > 0) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Product Images ({formData.images.length + imageFiles.length} total)
                    </p>
                    <span className="text-xs text-gray-500">First image will be the main product image</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Existing Images */}
                    {formData.images.map((img, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-300 bg-white">
                          <img
                            src={getImageUrl(img)}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-br">
                            #{index + 1}
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => handleReplaceImage(index)}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                              title="Replace image"
                              disabled={uploading}
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold"
                              title="Delete image"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-center truncate">Existing</p>
                      </div>
                    ))}
                    
                    {/* New Images (to be uploaded) */}
                    {imageFiles.map((file, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-300 bg-white">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-br">
                            #{formData.images.length + index + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                            title="Remove image"
                          >
                            <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                              ×
                            </span>
                          </button>
                        </div>
                        <p className="text-xs text-green-600 mt-1 text-center truncate">New</p>
                      </div>
                    ))}
                  </div>
                  
                  {formData.images.length === 0 && imageFiles.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No images added yet</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : editingProduct ? 'Update' : 'Create'} Product
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={uploading}
                className="px-6 py-2 border rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={getImageUrl(product.images[0])}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xl">
                        🍰
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium">{product.name}</div>
                      {product.images && product.images.length > 0 && (
                        <div className="text-xs text-gray-500">{product.images.length} image(s)</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.category?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  ₹{product.weightOptions?.[0]?.price || product.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {product.isPreOrder && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 mt-1">Pre-order</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-primary-600 hover:text-primary-800 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;

