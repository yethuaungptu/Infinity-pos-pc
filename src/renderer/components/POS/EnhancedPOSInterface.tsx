import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  CreditCardIcon,
  PrinterIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import {
  Product,
  Customer,
  Transaction,
  TransactionItem,
  CustomerType,
  PaymentMethod,
} from '../../types/core';

const EnhancedPOSInterface: React.FC = () => {
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isOffline, setIsOffline] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        sku: 'FEED001',
        name: 'Premium Poultry Feed',
        description: 'High-quality feed for laying hens',
        type: 'feed',
        category: 'poultry_feed',
        costPrice: 25.0,
        sellingPrice: 35.0,
        wholesalePrice: 32.0,
        stock: 150,
        unit: 'bags',
        minimumStock: 20,
        animalType: 'poultry',
        primaryVendorId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      },
      {
        id: '2',
        sku: 'MED001',
        name: 'Poultry Antibiotic',
        description: 'Broad spectrum antibiotic for poultry',
        type: 'medicine',
        category: 'antibiotics',
        costPrice: 15.0,
        sellingPrice: 25.0,
        stock: 45,
        unit: 'bottles',
        minimumStock: 10,
        requiresPrescription: true,
        activeIngredient: 'Amoxicillin',
        expiryDate: new Date('2025-12-31'),
        primaryVendorId: '2',
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      },
      {
        id: '3',
        sku: 'EGG001',
        name: 'Fresh Hen Eggs - Large',
        description: 'Fresh large hen eggs',
        type: 'eggs',
        category: 'hen_eggs',
        costPrice: 2.0,
        sellingPrice: 3.5,
        stock: 200,
        unit: 'dozens',
        minimumStock: 50,
        primaryVendorId: 'farmers',
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      },
      {
        id: '4',
        sku: 'EGG002',
        name: 'Fresh Duck Eggs - Large',
        description: 'Fresh large duck eggs',
        type: 'eggs',
        category: 'duck_eggs',
        costPrice: 3.5,
        sellingPrice: 5.0,
        stock: 80,
        unit: 'dozens',
        minimumStock: 20,
        primaryVendorId: 'farmers',
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      },
    ];

    const mockCustomers: Customer[] = [
      {
        id: '1',
        type: 'farmer',
        businessName: 'Happy Hen Farm',
        contactPerson: 'John Farm',
        phone: '+1-555-0301',
        email: 'john@happyhenfarm.com',
        creditLimit: 10000,
        creditBalance: 2500,
        paymentTerms: 30,
        creditStatus: 'current',
        farmSize: 50,
        animalTypes: ['poultry'],
        eggProduction: {
          henEggs: 120,
          duckEggs: 30,
          collectionSchedule: 'daily',
        },
        totalPurchases: 25000,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date(),
        active: true,
      },
      {
        id: '2',
        type: 'regular',
        contactPerson: 'Mary Smith',
        phone: '+1-555-0401',
        email: 'mary@email.com',
        creditLimit: 1000,
        creditBalance: 150,
        paymentTerms: 15,
        creditStatus: 'current',
        isRetail: true,
        loyaltyPoints: 250,
        totalPurchases: 3500,
        createdAt: new Date('2023-06-10'),
        updatedAt: new Date(),
        active: true,
      },
      {
        id: '3',
        type: 'wholesale',
        businessName: 'City Market',
        contactPerson: 'Bob Johnson',
        phone: '+1-555-0501',
        email: 'bob@citymarket.com',
        creditLimit: 5000,
        creditBalance: 800,
        paymentTerms: 30,
        creditStatus: 'current',
        totalPurchases: 15000,
        createdAt: new Date('2023-03-20'),
        updatedAt: new Date(),
        active: true,
      },
    ];

    setProducts(mockProducts);
    setCustomers(mockCustomers);
  }, []);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const price = getCustomerPrice(product);
      const newItem: TransactionItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unit: product.unit,
        unitPrice: price,
        total: price,
      };
      setCart([...cart, newItem]);
    }
  };

  const getCustomerPrice = (product: Product): number => {
    if (!selectedCustomer) return product.sellingPrice;

    switch (selectedCustomer.type) {
      case 'farmer':
        return product.wholesalePrice || product.sellingPrice;
      case 'wholesale':
        return product.wholesalePrice || product.sellingPrice;
      default:
        return product.sellingPrice;
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.unitPrice,
            }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.productId !== productId),
    );
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const getAvailableCredit = (): number => {
    if (!selectedCustomer) return 0;
    return selectedCustomer.creditLimit - selectedCustomer.creditBalance;
  };

  const canProcessCreditSale = (): boolean => {
    if (paymentMethod !== 'credit') return true;
    if (!selectedCustomer) return false;

    const { total } = calculateTotals();
    return getAvailableCredit() >= total;
  };

  const processPayment = async () => {
    const { subtotal, tax, total } = calculateTotals();

    if (paymentMethod === 'credit' && !canProcessCreditSale()) {
      alert('Insufficient credit limit for this customer!');
      return;
    }

    const transaction: Transaction = {
      id: `TXN_${Date.now()}`,
      receiptNumber: `RCP-${Date.now()}`,
      type: 'sale',
      customerId: selectedCustomer?.id,
      items: [...cart],
      subtotal,
      tax,
      discount: 0,
      total,
      paymentMethod,
      paidAmount: paymentMethod === 'credit' ? 0 : total,
      balanceAmount: paymentMethod === 'credit' ? total : 0,
      status: 'completed',
      staffId: 'current-user',
      timestamp: new Date(),
      dueDate:
        paymentMethod === 'credit' && selectedCustomer
          ? new Date(
              Date.now() + selectedCustomer.paymentTerms * 24 * 60 * 60 * 1000,
            )
          : undefined,
      synced: false,
    };

    try {
      console.log('Processing payment:', transaction);

      // Update customer credit balance if credit sale
      if (paymentMethod === 'credit' && selectedCustomer) {
        const updatedCustomer = {
          ...selectedCustomer,
          creditBalance: selectedCustomer.creditBalance + total,
          totalPurchases: selectedCustomer.totalPurchases + total,
          updatedAt: new Date(),
        };
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c)),
        );
        setSelectedCustomer(updatedCustomer);
      }

      // Update inventory
      for (const item of cart) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          const updatedProduct = {
            ...product,
            stock: product.stock - item.quantity,
            updatedAt: new Date(),
          };
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? updatedProduct : p)),
          );
        }
      }

      // Clear cart and reset
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');

      // Show success message
      alert(
        `${paymentMethod === 'credit' ? 'Credit sale' : 'Payment'} processed successfully! Total: $${total.toFixed(2)}`,
      );
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;

    return matchesSearch && matchesCategory && product.active;
  });

  const filteredCustomers = customers.filter((customer) => {
    const searchString =
      `${customer.businessName || ''} ${customer.contactPerson} ${customer.phone || ''}`.toLowerCase();
    return searchString.includes(customerSearchTerm.toLowerCase());
  });

  const categories = ['all', ...new Set(products.map((p) => p.category))];
  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Product Selection Area */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Agricultural POS
            </h1>
            <div className="flex items-center space-x-4">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isOffline
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {isOffline ? 'Offline Mode' : 'Online'}
              </div>
              {selectedCustomer && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {selectedCustomer.type === 'farmer'
                    ? '🚜'
                    : selectedCustomer.type === 'wholesale'
                      ? '🏪'
                      : '👤'}
                  {selectedCustomer.businessName ||
                    selectedCustomer.contactPerson}
                </div>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all'
                    ? 'All Categories'
                    : category.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const price = getCustomerPrice(product);
            const isLowStock = product.stock <= product.minimumStock;

            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border"
              >
                <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center relative">
                  <div className="text-4xl">
                    {product.type === 'feed'
                      ? '🌾'
                      : product.type === 'medicine'
                        ? '💊'
                        : product.type === 'eggs'
                          ? '🥚'
                          : '📦'}
                  </div>
                  {isLowStock && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                  {product.requiresPrescription && (
                    <div className="absolute top-1 left-1 text-red-500 text-xs">
                      Rx
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-600 mb-2">SKU: {product.sku}</p>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-blue-600">
                    ${price.toFixed(2)}
                  </span>
                  {selectedCustomer?.type === 'farmer' &&
                    product.wholesalePrice && (
                      <span className="text-xs text-green-600">
                        Farmer Price
                      </span>
                    )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`px-2 py-1 rounded ${
                      isLowStock
                        ? 'bg-red-100 text-red-800'
                        : product.stock > product.minimumStock * 2
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    Stock: {product.stock} {product.unit}
                  </span>

                  {product.expiryDate && (
                    <span className="text-gray-500">
                      Exp: {product.expiryDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart and Checkout Area */}
      <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col">
        {/* Customer Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <UserIcon className="w-5 h-5 text-gray-600 mr-2" />
              <span className="font-medium text-gray-900">Customer</span>
            </div>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Select Customer
            </button>
          </div>

          {selectedCustomer ? (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {selectedCustomer.type === 'farmer' ? (
                    <BuildingOfficeIcon className="w-4 h-4 text-green-600 mr-2" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-blue-600 mr-2" />
                  )}
                  <span className="font-medium">
                    {selectedCustomer.businessName ||
                      selectedCustomer.contactPerson}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Credit Limit:</span>
                  <span>${selectedCustomer.creditLimit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding:</span>
                  <span className="text-red-600">
                    ${selectedCustomer.creditBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Available Credit:</span>
                  <span className="text-green-600">
                    ${getAvailableCredit().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Terms:</span>
                  <span>{selectedCustomer.paymentTerms} days</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 p-3 rounded-lg text-center text-gray-500">
              Walk-in Customer
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <ShoppingCartIcon className="w-5 h-5 mr-2" />
            Cart ({cart.length})
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {item.productName}
                  </h4>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      ${item.unitPrice.toFixed(2)}/{item.unit}
                    </div>
                    <div className="font-medium">${item.total.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="mr-2"
              />
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              Cash
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="credit"
                checked={paymentMethod === 'credit'}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="mr-2"
                disabled={!selectedCustomer}
              />
              <CreditCardIcon className="w-4 h-4 mr-2" />
              Credit{' '}
              {!selectedCustomer && (
                <span className="text-gray-400">(Select customer first)</span>
              )}
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="bank_transfer"
                checked={paymentMethod === 'bank_transfer'}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="mr-2"
              />
              <span className="mr-2">🏦</span>
              Bank Transfer
            </label>
          </div>

          {paymentMethod === 'credit' &&
            selectedCustomer &&
            !canProcessCreditSale() && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">
                  Insufficient credit limit!
                </span>
              </div>
            )}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {paymentMethod === 'credit' && selectedCustomer && (
              <div className="text-sm text-gray-600">
                Due Date:{' '}
                {new Date(
                  Date.now() +
                    selectedCustomer.paymentTerms * 24 * 60 * 60 * 1000,
                ).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={processPayment}
            disabled={
              cart.length === 0 ||
              (paymentMethod === 'credit' && !canProcessCreditSale())
            }
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {paymentMethod === 'credit' ? (
              <>
                <CreditCardIcon className="w-5 h-5 mr-2" />
                Process Credit Sale
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Process Payment
              </>
            )}
          </button>

          <button
            disabled={cart.length === 0}
            className="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <PrinterIcon className="w-5 h-5 mr-2" />
            Print Receipt
          </button>

          <button
            onClick={() => setCart([])}
            disabled={cart.length === 0}
            className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Select Customer
                </h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerModal(false);
                      setCustomerSearchTerm('');
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {customer.type === 'farmer'
                            ? '🚜'
                            : customer.type === 'wholesale'
                              ? '🏪'
                              : '👤'}
                        </div>
                        <div>
                          <div className="font-medium">
                            {customer.businessName || customer.contactPerson}
                          </div>
                          <div className="text-sm text-gray-600">
                            {customer.phone} • {customer.type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-600">
                          Credit: ${customer.creditLimit.toLocaleString()}
                        </div>
                        <div
                          className={`${customer.creditBalance > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          Balance: ${customer.creditBalance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPOSInterface;
