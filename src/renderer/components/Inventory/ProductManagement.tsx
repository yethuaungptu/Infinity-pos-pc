// ProductManagement.tsx - Main Component
// Place AddProductModal.tsx and ImportVendorModal.tsx in the same directory

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { Product } from '../../types/core';
import AddProductModal from './AddProductModal';
import ImportVendorModal from './ImportVendorModal';

interface TypeData {
  id: string;
  name: string;
}

interface ProductManagementProps {
  onNavigateToPurchaseOrders?: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({
  onNavigateToPurchaseOrders,
}) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [typeData] = useState<TypeData[]>([
    { id: '1', name: 'FEED' },
    { id: '2', name: 'MEDICINE' },
    { id: '3', name: 'EQUIPMENT' },
    { id: '4', name: 'EGGS' },
    { id: '5', name: 'SUPPLIES' },
    { id: '6', name: 'OTHER' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<keyof Product>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [staffId, setStaffId] = useState('');

  const [shippingFee, setShippingFee] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [importItems, setImportItems] = useState<
    Array<{
      productId: string;
      productName: string;
      productSku: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }>
  >([]);
  const [purchaseOrderNotes, setPurchaseOrderNotes] = useState('');

  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    name: '',
    description: '',
    type: 'FEED',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    wholesalePrice: 0,
    stock: 0,
    unit: '',
    minimumStock: 0,
    expiryDate: new Date(),
    batchNumber: '',
    manufacturer: '',
    requiresPrescription: false,
    activeIngredient: '',
    dosage: '',
    animalType: '',
    nutritionInfo: '',
    feedType: '',
    primaryVendorId: '',
    alternateVendors: [''],
    active: true,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await window.api.getProducts();
        setProducts(products);
        const staff: any = await window.api.check();
        setStaffId(staff.id);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    };
    fetchProducts();

    const fetchVendors = async () => {
      try {
        const allVendors = await window.api.getVendors();
        setVendors(allVendors);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([]);
      }
    };

    fetchVendors();
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
        type: 'FEED',
        category: '',
        costPrice: 0,
        sellingPrice: 0,
        wholesalePrice: 0,
        stock: 0,
        unit: '',
        minimumStock: 0,
        expiryDate: new Date(),
        batchNumber: '',
        manufacturer: '',
        requiresPrescription: false,
        activeIngredient: '',
        dosage: '',
        animalType: '',
        nutritionInfo: '',
        feedType: '',
        primaryVendorId: '',
        alternateVendors: [''],
        active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const updateFormData = formData;
        const { primaryVendorId } = updateFormData;
        delete updateFormData.primaryVendorId;
        const updatedProduct = {
          ...updateFormData,
          primaryVendor: { connect: { id: primaryVendorId } },
          updatedAt: new Date(),
        } as Product;
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p)),
        );
        await window.api.updateProductData(updatedProduct);
      } else {
        const { primaryVendorId, alternateVendors, ...rest } = formData;
        const newProduct: any = {
          ...rest,
          primaryVendor: { connect: { id: primaryVendorId } },
          alternateVendors: alternateVendors?.length ? alternateVendors : [],
        };
        await window.api.createProductData(newProduct);
        setProducts((prev) => [...prev, newProduct]);
      }
      closeModal();
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

  const openImportModal = () => {
    setShowImportModal(true);
    setSelectedVendor('');
    setVendorProducts([]);
    setImportItems([]);
    setPurchaseOrderNotes('');
    setShippingFee(0); // Add this line
  };

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendor(vendorId);
    if (vendorId) {
      const productsFromVendor = products.filter(
        (p) => p.primaryVendorId === vendorId,
      );
      setVendorProducts(productsFromVendor);
    } else {
      setVendorProducts([]);
    }
  };

  const addImportItem = (product: Product) => {
    if (importItems.find((item) => item.productId === product.id)) {
      alert('Product already added to import list');
      return;
    }
    setImportItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: 1,
        unitCost: product.costPrice,
        totalCost: product.costPrice,
      },
    ]);
  };

  const updateImportItem = (
    productId: string,
    field: 'quantity' | 'unitCost',
    value: number,
  ) => {
    setImportItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const updated = { ...item, [field]: value };
          updated.totalCost = updated.quantity * updated.unitCost;
          return updated;
        }
        return item;
      }),
    );
  };

  const removeImportItem = (productId: string) => {
    setImportItems((prev) =>
      prev.filter((item) => item.productId !== productId),
    );
  };

  const handleSubmitPurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || importItems.length === 0) {
      alert('Please select a vendor and add products');
      return;
    }
    try {
      const subtotal = importItems.reduce(
        (sum, item) => sum + item.totalCost,
        0,
      );
      const purchaseOrder = {
        orderNumber: `PO-${Date.now()}`,
        vendor: {
          connect: { id: selectedVendor },
        },
        orderDate: new Date(),
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        subtotal,
        tax: 0,
        shipping: shippingFee,
        total: subtotal + shippingFee,
        status: 'PENDING',
        staff: { connect: { id: staffId } },
        notes: purchaseOrderNotes || undefined,
        items: {
          create: importItems.map((item) => ({
            product: {
              connect: { id: item.productId },
            },
            productName: item.productName,
            productSku: item.productSku,
            quantityOrdered: item.quantity,
            quantityReceived: 0,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
          })),
        },
      };
      console.log('Creating purchase order:', purchaseOrder);
      await window.api.createPurchaseData(purchaseOrder);
      alert('Purchase order created successfully!');
      setShowImportModal(false);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Failed to create purchase order. Please try again.');
    }
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
      return sortOrder === 'asc'
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
          ? 1
          : -1;
    });

  const lowStockCount = products.filter((p) => p.stock <= 10).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
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
          <div className="flex space-x-3">
            <button
              onClick={
                onNavigateToPurchaseOrders ||
                (() => (window.location.href = '/purchaseOrders'))
              }
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 flex items-center"
            >
              <TruckIcon className="w-5 h-5 mr-2" />
              View Purchase Orders
            </button>
            <button
              onClick={openImportModal}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center"
            >
              <TruckIcon className="w-5 h-5 mr-2" />
              Import from Vendor
            </button>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Product
            </button>
          </div>
        </div>

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
            <p className="text-gray-600">Product Types</p>
          </div>
        </div>

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
            <option value="all">All Types</option>
            {typeData.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
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
            <option value="stock-asc">Stock (Low-High)</option>
            <option value="stock-desc">Stock (High-Low)</option>
          </select>
        </div>
      </div>

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
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.stock <= 5 ? 'bg-red-100 text-red-800' : product.stock <= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
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
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
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

      <AddProductModal
        showModal={showModal}
        editingProduct={editingProduct}
        formData={formData}
        vendors={vendors}
        onClose={closeModal}
        onSubmit={handleSubmit}
        setFormData={setFormData}
        generateSKU={generateSKU}
      />

      <ImportVendorModal
        showModal={showImportModal}
        vendors={vendors}
        selectedVendor={selectedVendor}
        vendorProducts={vendorProducts}
        importItems={importItems}
        purchaseOrderNotes={purchaseOrderNotes}
        shippingFee={shippingFee} // Add this
        onClose={() => setShowImportModal(false)}
        onVendorSelect={handleVendorSelect}
        onAddItem={addImportItem}
        onUpdateItem={updateImportItem}
        onRemoveItem={removeImportItem}
        onSubmit={handleSubmitPurchaseOrder}
        setPurchaseOrderNotes={setPurchaseOrderNotes}
        setShippingFee={setShippingFee} // Add this
      />
    </div>
  );
};

export default ProductManagement;
