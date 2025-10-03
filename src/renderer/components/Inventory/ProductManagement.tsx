import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Product } from '../../types/core';

// interface Product {
//   id: string;
//   sku: string;
//   name: string;
//   description?: string;
//   sellingPrice: number;
//   costPrice: number;
//   stock: number;
//   category: string;
//   supplier?: string;
//   barcode?: string;
//   image?: string;
//   lastUpdated: Date;
//   active: boolean;
// }

interface TypeData {
  id: string;
  name: string;
  description?: string;
}
enum ProductType {
  FEED,
  MEDICINE,
  EQUIPMENT,
  EGGS,
  SUPPLIES,
  OTHER,
}

const ProductManagement: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [typeData, setTypeData] = useState<TypeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<keyof Product>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    name: '',
    description: '',
    type: 'FEED', // must be selected by user
    category: '',

    // Pricing
    costPrice: 0,
    sellingPrice: 0,
    wholesalePrice: 0,

    // Inventory
    stock: 0,
    unit: '',
    minimumStock: 0,

    // Attributes
    expiryDate: new Date(),
    batchNumber: '',
    manufacturer: '',

    // Medicine
    requiresPrescription: false,
    activeIngredient: '',
    dosage: '',

    // Feed
    animalType: '',
    nutritionInfo: '',
    feedType: '',

    // Vendor
    primaryVendorId: '',
    alternateVendors: [''],

    // Other
    active: true,
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await window.api.getProducts();
        console.log('Fetched products from InventoryService:', products);
        setProducts(products); // Replace with allProducts when backend is ready
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]); // Fallback to mock data on error
      }
    };
    fetchProducts();
    const fetchVendors = async () => {
      try {
        const allVendors = await window.api.getVendors();
        setVendors(allVendors);
        console.log('Fetched vendors from VendorService:', allVendors);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([]); // Fallback to empty array on error
      }
    };
    fetchVendors();
    const mockType: TypeData[] = [
      { id: '1', name: 'FEED', description: 'Coffee, tea, and drinks' },
      {
        id: '2',
        name: 'MEDICINE',
        description: 'Cups, mugs, and equipment',
      },
      { id: '3', name: 'EQUIPMENT', description: 'Milk and dairy products' },
      {
        id: '4',
        name: 'EGGS',
        description: 'Sugar, sweeteners, and flavorings',
      },
      {
        id: '5',
        name: 'SUPPLIES',
        description: 'Sugar, sweeteners, and flavorings',
      },
      {
        id: '6',
        name: 'OTHER',
        description: 'Sugar, sweeteners, and flavorings',
      },
    ];

    // const mockProducts: Product[] = [];

    setTypeData(mockType);
    // setProducts(mockProducts);
  }, []);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product });
    } else {
      setEditingProduct(null);
      setFormData({
        sku: '',
        name: '',
        description: '',
        type: 'FEED', // must be selected by user
        category: '',

        // Pricing
        costPrice: 0,
        sellingPrice: 0,
        wholesalePrice: 0,

        // Inventory
        stock: 0,
        unit: '',
        minimumStock: 0,

        // Attributes
        expiryDate: new Date(),
        batchNumber: '',
        manufacturer: '',

        // Medicine
        requiresPrescription: false,
        activeIngredient: '',
        dosage: '',

        // Feed
        animalType: '',
        nutritionInfo: '',
        feedType: '',

        // Vendor
        primaryVendorId: '',
        alternateVendors: [''],

        // Other
        active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        // Update existing product
        const updateFormData = formData;
        const { primaryVendorId } = updateFormData;
        delete updateFormData.primaryVendorId;
        const updatedProduct = {
          ...updateFormData,
          primaryVendor: {
            connect: { id: primaryVendorId },
          },
          updatedAt: new Date(),
        } as Product;

        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p)),
        );
        await window.api.updateProductData(updatedProduct);
      } else {
        // Create new product
        const { primaryVendorId, alternateVendors, ...rest } = formData;

        const newProduct: any = {
          ...rest,
          // Vendor relation
          primaryVendor: {
            connect: { id: primaryVendorId },
          },

          // Optional JSON field
          alternateVendors: alternateVendors?.length ? alternateVendors : [],
        };
        const createdProduct = await window.api.createProductData(newProduct);
        setProducts((prev) => [...prev, newProduct]);
        console.log('Created product:', newProduct);
      }

      closeModal();
      // Show success message
      alert(
        editingProduct
          ? 'Product updated successfully!'
          : 'Product created successfully!',
      );
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        console.log('Deleted product:', productId);
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    setFormData((prev) => ({ ...prev, sku: `PROD${timestamp}${randomNum}` }));
  };

  const generateBarcode = () => {
    const barcode = Math.floor(Math.random() * 9000000000000) + 1000000000000;
    setFormData((prev) => ({ ...prev, barcode: barcode.toString() }));
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedType === 'all' || product.type === selectedType;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const lowStockCount = products.filter((p) => p.stock <= 10).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Product Management
            </h1>
            <p className="text-gray-600">
              Manage your inventory and product catalog
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">
              {products.length}
            </h3>
            <p className="text-gray-600">Total Products</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-green-600">
              {products.filter((p) => p.active).length}
            </h3>
            <p className="text-gray-600">Active Products</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-red-600">
              {lowStockCount}
            </h3>
            <p className="text-gray-600">Low Stock Alerts</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-600">
              {typeData.length}
            </h3>
            <p className="text-gray-600">Product Type</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            {typeData.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as keyof Product);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low-High)</option>
            <option value="price-desc">Price (High-Low)</option>
            <option value="stock-asc">Stock (Low-High)</option>
            <option value="stock-desc">Stock (High-Low)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wholesale Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <PhotoIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.costPrice} MMK
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sellingPrice} MMK
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.wholesalePrice} MMK
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock <= 5
                          ? 'bg-red-100 text-red-800'
                          : product.stock <= 10
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.type.charAt(0).toUpperCase() +
                      product.type.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* SKU + Generate */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku || ''}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, sku: e.target.value }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateSKU}
                    className="mt-6 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Generate
                  </button>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name: e.target.value }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      value={formData.type || ''}
                      onChange={(e) =>
                        setFormData((p: any) => ({
                          ...p,
                          type: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="FEED">Feed</option>
                      <option value="MEDICINE">Medicine</option>
                      <option value="EQUIPMENT">Equipment</option>
                      <option value="EGGS">Eggs</option>
                      <option value="SUPPLIES">Supplies</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.costPrice || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          costPrice: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Selling Price
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.sellingPrice || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          sellingPrice: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Wholesale Price
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.wholesalePrice || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          wholesalePrice: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {/* Inventory */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={formData.stock || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          stock: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unit
                    </label>
                    <select
                      value={formData.unit || ''}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, unit: e.target.value }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select unit</option>
                      <option value="kg">Kg</option>
                      <option value="bags">Bags</option>
                      <option value="pieces">Pieces</option>
                      <option value="dozens">Dozens</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Minimum Stock
                    </label>
                    <input
                      type="number"
                      value={formData.minimumStock || 0}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          minimumStock: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={
                        formData.expiryDate
                          ? new Date(formData.expiryDate)
                              .toISOString()
                              .split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          expiryDate: e.target.value
                            ? new Date(e.target.value)
                            : p.expiryDate,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Batch No
                    </label>
                    <input
                      type="text"
                      value={formData.batchNumber || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          batchNumber: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={formData.manufacturer || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          manufacturer: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {/* Medicine-specific */}
                {formData.type === 'MEDICINE' && (
                  <div className="space-y-2 border p-3 rounded-md">
                    <h4 className="font-medium">Medicine Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Active Ingredient
                        </label>
                        <input
                          type="text"
                          value={formData.activeIngredient || ''}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              activeIngredient: e.target.value,
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={formData.dosage || ''}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              dosage: e.target.value,
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="prescription"
                        checked={formData.requiresPrescription || false}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            requiresPrescription: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="prescription" className="ml-2 text-sm">
                        Requires Prescription
                      </label>
                    </div>
                  </div>
                )}

                {/* Feed-specific */}
                {formData.type === 'FEED' && (
                  <div className="space-y-2 border p-3 rounded-md">
                    <h4 className="font-medium">Feed Details</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Animal Type
                        </label>

                        <select
                          value={formData.animalType || ''}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              animalType: e.target.value,
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        >
                          <option value="">Select Animal Type</option>
                          <option value="poultry">Poultry</option>
                          <option value="cattle">Cattle</option>
                          <option value="dairy">Dairy</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Feed Type
                        </label>
                        <select
                          value={formData.feedType || ''}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              feedType: e.target.value,
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        >
                          <option value="">Select Feed Type</option>
                          <option value="starter">Starter</option>
                          <option value="grower">Grower</option>
                          <option value="layer">Layer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nutrition Info
                        </label>
                        <input
                          type="text"
                          value={formData.nutritionInfo || ''}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              nutritionInfo: e.target.value,
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Vendor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Primary Vendor ID
                  </label>

                  <select
                    value={formData.primaryVendorId || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        primaryVendorId: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select Primary Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active || false}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, active: e.target.checked }))
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 text-sm">
                    Product is active
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
