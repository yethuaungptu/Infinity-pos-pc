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

declare global {
  interface Window {
    api: {
      check: () => Promise<any[]>;
      login: (data: any) => Promise<any[]>;
      logout: () => Promise<any[]>;
      getProducts: () => Promise<any[]>;
      createProductData: (data: any) => Promise<any>;
      getVendors: () => Promise<any[]>;
      updateProductData: (data: any) => Promise<any>;
      getTodaySalesSummary: () => Promise<any>;
      createVendorData: (data: any) => Promise<any>;
      getCustomers: () => Promise<any[]>;
      createCustomerData: (data: any) => Promise<any>;
      getCustomerDetail: (id: string) => Promise<any>;
      getCustomerTransactions: (id: string) => Promise<any>;
      createTransactionData: (data: any) => Promise<any>;
      updateCustomer: (data: any) => Promise<any>;
      getStaffs: () => Promise<any[]>;
      createStaffData: (data: any) => Promise<any>;
      updateStaff: (data: any) => Promise<any>;
      getPaymentRecord: () => Promise<any[]>;
      getPaymentRecordsWithCustomerId: (id: string) => Promise<any>;
      createPaymentRecordData: (data: any) => Promise<any>;
      updatePaymentRecord: (data: any) => Promise<any>;
    };
  }
}

const EnhancedPOSInterface: React.FC<{ onDataChanged: () => void }> = ({
  onDataChanged,
}) => {
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setCategoryFilter] = useState<string>('all');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isOffline, setIsOffline] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await window.api.getProducts();
        console.log('Fetched products from InventoryService:', result);
        setProducts(result); // Replace with allProducts when backend is ready
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]); // Fallback to mock data on error
      }
    };
    const fetchCustomers = async () => {
      try {
        const result = await window.api.getCustomers();
        setCustomers(result);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]); // Fallback to empty list on error
      }
    };

    fetchCustomers();
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(
      (item) => item.product.connect.id === product.id,
    );

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const price = getCustomerPrice(product);
      const newItem: TransactionItem = {
        id: Date.now().toString(),
        product: {
          connect: { id: product.id },
        },
        productName: product.name,
        productSku: product.sku,
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
      case 'FARMER':
        return product.wholesalePrice || product.sellingPrice;
      case 'WHOLESALE':
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
        item.product.connect.id === productId
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
      prevCart.filter((item) => item.product.connect.id !== productId),
    );
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    // const tax = subtotal * 0.08; // 8% tax rate
    const total = subtotal;
    // return { subtotal, tax, total };
    return { subtotal, total };
  };

  const getAvailableCredit = (): number => {
    if (!selectedCustomer) return 0;
    return selectedCustomer.creditLimit - selectedCustomer.creditBalance;
  };

  const canProcessCreditSale = (): boolean => {
    if (paymentMethod !== 'CREDIT') return true;
    if (!selectedCustomer) return false;

    const { total } = calculateTotals();
    return getAvailableCredit() >= total;
  };

  const processPayment = async () => {
    const { subtotal, total } = calculateTotals();

    if (paymentMethod === 'CREDIT' && !canProcessCreditSale()) {
      alert('Insufficient credit limit for this customer!');
      return;
    }
    const staff: any = await window.api.check();
    const transactionId = `TXN_${Date.now()}`;
    const transaction: Transaction = {
      id: transactionId,
      receiptNumber: `RCP-${Date.now()}`,
      type: 'SALE',
      customerId: selectedCustomer?.id,
      items: { create: [...cart] },
      subtotal,
      tax: 0,
      discount: 0,
      total,
      paymentMethod,
      paidAmount: paymentMethod === 'CREDIT' ? 0 : total,
      balanceAmount: paymentMethod === 'CREDIT' ? total : 0,
      status: 'COMPLETED',
      staffId: staff.id,
      timestamp: new Date(),
      dueDate:
        paymentMethod === 'CREDIT' && selectedCustomer
          ? new Date(
              Date.now() + selectedCustomer.paymentTerms * 24 * 60 * 60 * 1000,
            )
          : undefined,
      synced: false,
    };

    try {
      const result = await window.api.createTransactionData(transaction);
      console.log('Processing payment:', transaction);

      // Update customer credit balance if credit sale
      if (paymentMethod === 'CREDIT' && selectedCustomer) {
        const updatedCustomer = {
          ...selectedCustomer,
          creditBalance: selectedCustomer.creditBalance + total,
          totalPurchases: selectedCustomer.totalPurchases + total,
          updatedAt: new Date(),
        };
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c)),
        );
        await window.api.updateCustomer(updatedCustomer);
        setSelectedCustomer(updatedCustomer);
      }

      // Update inventory
      for (const item of cart) {
        const product = products.find((p) => p.id === item.product.connect.id);
        if (product) {
          const updatedProduct = {
            ...product,
            stock: product.stock - item.quantity,
            updatedAt: new Date(),
          };
          await window.api.updateProductData(updatedProduct);
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? updatedProduct : p)),
          );
        }
      }

      // Clear cart and reset
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('CASH');

      // Show success message
      alert(
        `${paymentMethod === 'CREDIT' ? 'Credit sale' : 'Payment'} processed successfully! Total: ${total} MMK`,
      );
      onDataChanged();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || product.type === typeFilter;

    return matchesSearch && matchesType && product.active;
  });

  const filteredCustomers = customers.filter((customer) => {
    const searchString =
      `${customer.businessName || ''} ${customer.contactPerson} ${customer.phone || ''}`.toLowerCase();
    return searchString.includes(customerSearchTerm.toLowerCase());
  });

  const types = ['all', ...new Set(products.map((p) => p.type))];
  const { subtotal, total } = calculateTotals();

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
                  {selectedCustomer.type === 'FARMER'
                    ? '🚜'
                    : selectedCustomer.type === 'WHOLESALE'
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
              value={typeFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {types.map((category) => (
                <option key={category} value={category}>
                  {category === 'all'
                    ? 'All types'
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
                    {product.type === 'FEED'
                      ? '🌾'
                      : product.type === 'MEDICINE'
                        ? '💊'
                        : product.type === 'EGGS'
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
                    {price} MMK
                  </span>
                  {selectedCustomer?.type === 'FARMER' &&
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
                  {selectedCustomer.type === 'FARMER' ? (
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
                  <span>
                    {selectedCustomer.creditLimit.toLocaleString()} MMK
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding:</span>
                  <span className="text-red-600">
                    {selectedCustomer.creditBalance.toLocaleString()} MMK
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Available Credit:</span>
                  <span className="text-green-600">
                    {getAvailableCredit().toLocaleString()} MMK
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
                    onClick={() => removeFromCart(item.product.connect.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.connect.id,
                          item.quantity - 1,
                        )
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.connect.id,
                          item.quantity + 1,
                        )
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {item.unitPrice} MMK / {item.unit}
                    </div>
                    <div className="font-medium">{item.total} MMK</div>
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
                value="CASH"
                checked={paymentMethod === 'CASH'}
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
                value="CREDIT"
                checked={paymentMethod === 'CREDIT'}
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
                value="BANK_TRANSFER"
                checked={paymentMethod === 'BANK_TRANSFER'}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="mr-2"
              />
              <span className="mr-2">🏦</span>
              Bank Transfer
            </label>
          </div>

          {paymentMethod === 'CREDIT' &&
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
              <span>{subtotal} MMK</span>
            </div>
            {/* <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>${tax.toFixed(2)}</span>
            </div> */}
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{total} MMK</span>
            </div>
            {paymentMethod === 'CREDIT' && selectedCustomer && (
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
              (paymentMethod === 'CREDIT' && !canProcessCreditSale())
            }
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {paymentMethod === 'CREDIT' ? (
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
                          {customer.type === 'FARMER'
                            ? '🚜'
                            : customer.type === 'WHOLESALE'
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
