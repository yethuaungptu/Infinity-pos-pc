import React from 'react';
import { Product } from '../../types/core';

interface AddProductModalProps {
  showModal: boolean;
  editingProduct: Product | null;
  formData: Partial<Product>;
  vendors: any[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  generateSKU: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  showModal,
  editingProduct,
  formData,
  vendors,
  onClose,
  onSubmit,
  setFormData,
  generateSKU,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
                  setFormData((p: any) => ({ ...p, type: e.target.value }))
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
                setFormData((p) => ({ ...p, description: e.target.value }))
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
                    ? new Date(formData.expiryDate).toISOString().split('T')[0]
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
                  setFormData((p) => ({ ...p, batchNumber: e.target.value }))
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
                  setFormData((p) => ({ ...p, manufacturer: e.target.value }))
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
                      setFormData((p) => ({ ...p, dosage: e.target.value }))
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
                      setFormData((p) => ({ ...p, animalType: e.target.value }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
                      setFormData((p) => ({ ...p, feedType: e.target.value }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
              Primary Vendor
            </label>
            <select
              value={formData.primaryVendorId || ''}
              onChange={(e) =>
                setFormData((p) => ({ ...p, primaryVendorId: e.target.value }))
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
              onClick={onClose}
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
  );
};

export default AddProductModal;
