import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    couponCode: '',
    buttonText: 'Order Now',
    isActive: true,
    order: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await axios.get('/banners/all');
      setBanners(res.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = formData.image;

      // Upload new image if selected
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', imageFile);

        const uploadRes = await axios.post('/upload/single', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        imageUrl = uploadRes.data.imageUrl;
      }

      const submitData = {
        ...formData,
        image: imageUrl
      };

      if (editingBanner) {
        await axios.put(`/banners/${editingBanner._id}`, submitData);
        toast.success('Banner updated');
      } else {
        await axios.post('/banners', submitData);
        toast.success('Banner created');
      }
      fetchBanners();
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save banner');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image: banner.image || '',
      couponCode: banner.couponCode || '',
      buttonText: banner.buttonText || 'Order Now',
      isActive: banner.isActive !== false,
      order: banner.order || 0
    });
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      await axios.delete(`/banners/${id}`);
      toast.success('Banner deleted');
      fetchBanners();
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      couponCode: '',
      buttonText: 'Order Now',
      isActive: true,
      order: 0
    });
    setImageFile(null);
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
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
        <h1 className="text-2xl font-bold">Banners</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          + Add Banner
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingBanner ? 'Edit Banner' : 'Add New Banner'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg"
              />
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
              <label className="block text-sm font-medium mb-2">Banner Image</label>
              <div className="mb-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  id="banner-image-input"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a banner image (JPG, PNG, GIF, WebP - Max 5MB)</p>
              </div>
              
              {/* Image Preview Section */}
              {(imageFile || formData.image) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-gray-700">
                      {imageFile ? 'New Image Preview' : 'Current Banner Image'}
                    </p>
                    {formData.image && !imageFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image: '' });
                          setImageFile(null);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                  
                  <div className="relative max-w-md">
                    {imageFile ? (
                      <>
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="New banner preview"
                          className="w-full h-64 object-cover rounded-lg border-2 border-green-300 shadow-md"
                        />
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          New Image
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageFile(null)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-red-600"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <>
                        <img
                          src={getImageUrl(formData.image)}
                          alt="Current banner"
                          className="w-full h-64 object-cover rounded-lg border-2 border-blue-300 shadow-md"
                        />
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Current Image
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {!imageFile && !formData.image && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <p className="text-gray-500">No image selected</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Choose File" above to upload an image</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Coupon Code</label>
                <input
                  type="text"
                  value={formData.couponCode}
                  onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Button Text</label>
                <input
                  type="text"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order (Display Priority)</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label>Active</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : editingBanner ? 'Update' : 'Create'} Banner
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Banner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coupon Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {banners.map((banner) => (
              <tr key={banner._id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {banner.image ? (
                      <img
                        src={getImageUrl(banner.image)}
                        alt={banner.title}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xl">
                        🖼️
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium">{banner.title}</div>
                      {banner.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">{banner.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{banner.couponCode || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="text-primary-600 hover:text-primary-800 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
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

export default AdminBanners;

