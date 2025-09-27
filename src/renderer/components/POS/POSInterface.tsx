import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  CreditCardIcon,
  PrinterIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
}

interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerId?: string;
  timestamp: Date;
}

const POSInterface: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customerInfo, setCustomerInfo] = useState<string>('');
  const [isOffline, setIsOffline] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        sku: 'PROD001',
        name: 'Coffee Beans',
        price: 12.99,
        stock: 50,
        category: 'beverages',
      },
      {
        id: '2',
        sku: 'PROD002',
        name: 'Espresso Cup',
        price: 8.5,
        stock: 25,
        category: 'accessories',
      },
      {
        id: '3',
        sku: 'PROD003',
        name: 'Milk',
        price: 3.99,
        stock: 30,
        category: 'dairy',
      },
      {
        id: '4',
        sku: 'PROD004',
        name: 'Sugar Pack',
        price: 1.5,
        stock: 100,
        category: 'condiments',
      },
    ];
    setProducts(mockProducts);
  }, []);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item,
        );
      } else {
        return [...prevCart, { ...product, quantity: 1, total: product.price }];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const processPayment = async () => {
    const { subtotal, tax, total } = calculateTotals();

    const transaction: Transaction = {
      id: `TXN_${Date.now()}`,
      items: [...cart],
      subtotal,
      tax,
      total,
      customerId: customerInfo || undefined,
      timestamp: new Date(),
    };

    try {
      // Here you would call your payment processing service
      console.log('Processing payment:', transaction);

      // Clear cart after successful payment
      setCart([]);
      setCustomerInfo('');

      // Show success message
      alert(`Payment processed successfully! Total: $${total.toFixed(2)}`);
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
      selectedCategory === 'all' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
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
            <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isOffline
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {isOffline ? 'Offline Mode' : 'Online'}
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border"
            >
              <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <ShoppingCartIcon className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600">
                  ${product.price.toFixed(2)}
                </span>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    product.stock > 10
                      ? 'bg-green-100 text-green-800'
                      : product.stock > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  Stock: {product.stock}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart and Checkout Area */}
      <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col">
        {/* Customer Info */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <UserIcon className="w-5 h-5 text-gray-600 mr-2" />
            <span className="font-medium text-gray-900">Customer</span>
          </div>
          <input
            type="text"
            placeholder="Customer name or ID"
            value={customerInfo}
            onChange={(e) => setCustomerInfo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
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
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-medium">${item.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={processPayment}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <CreditCardIcon className="w-5 h-5 mr-2" />
            Process Payment
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
    </div>
  );
};

export default POSInterface;
