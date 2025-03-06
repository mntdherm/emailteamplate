import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown, Plus } from 'lucide-react';
import type { Service, ServiceCategory } from '../types/database';
import { createService, updateService, deleteService, createServiceCategory } from '../lib/db';

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
  vendorId: string;
  categories: ServiceCategory[];
  onServiceSaved: () => void;
}

const ServiceDialog: React.FC<ServiceDialogProps> = ({ 
  isOpen, 
  onClose, 
  service, 
  vendorId,
  categories,
  onServiceSaved 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    duration: '30',
    available: true,
    coinReward: '0'
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'car'
  });
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add/remove no-scroll class on body
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description,
        categoryId: service.categoryId,
        price: service.price.toString(),
        duration: service.duration.toString(),
        available: service.available,
        coinReward: (service.coinReward || 0).toString()
      });
    } else {
      setFormData({
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        price: '',
        duration: '30',
        available: true,
        coinReward: '0'
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId && categories.length > 0) {
      formData.categoryId = categories[0].id;
    }
    
    try {
      setLoading(true);
      setError(null);

      const serviceData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        duration: parseInt(formData.duration) || 30,
        coinReward: parseInt(formData.coinReward) || 0,
        categoryId: formData.categoryId || categories[0]?.id
      };

      if (service) {
        await updateService(service.id, {
          ...serviceData,
          vendorId // Ensure vendorId is preserved
        });
      } else {
        await createService({
          ...serviceData,
          vendorId,
          id: '' // Will be set by Firestore
        });
      }

      onServiceSaved();
      onClose();
    } catch (err) {
      console.error('Error saving service:', err);
      setError('Virhe palvelun tallennuksessa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;

    try {
      setLoading(true);
      setError(null);

      await deleteService(service.id);
      onServiceSaved();
      onClose();
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Virhe palvelun poistossa');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault?.();
    
    if (!newCategory.name || !newCategory.description) {
      setError('Täytä kaikki kentät');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const categoryId = await createServiceCategory({
        ...newCategory,
        vendorId,
        order: categories.length + 1,
        icon: newCategory.icon
      });
      
      // Set the new category as selected
      setFormData(prev => ({ ...prev, categoryId }));
      // Reset form
      setNewCategory({
        name: '',
        description: '',
        icon: 'car'
      });
      setShowNewCategoryForm(false);
      // Refresh categories list
      const refreshCategories = async () => {
        await onServiceSaved();
      };
      await refreshCategories();
      
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Virhe kategorian luonnissa');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {service ? 'Muokkaa palvelua' : 'Lisää uusi palvelu'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nimi</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kategoria</label>
              <div className="relative mt-1">
                <div className="flex space-x-2">
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 appearance-none pr-10"
                    required
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryForm(true)}
                    data-add-category
                    className="px-3 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 flex items-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* New Category Form */}
                {showNewCategoryForm && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg shadow-lg border z-10">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kategorian nimi</label>
                        <input
                          placeholder="Esim. Premium-pesut"
                          type="text"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kuvaus</label>
                        <input
                          placeholder="Esim. Premium-tason autopesupalvelut"
                          type="text"
                          value={newCategory.description}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Kuvake</label>
                        <select
                          value={newCategory.icon}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="car">Auto</option>
                          <option value="armchair">Sisätilat</option>
                          <option value="star">Premium</option>
                          <option value="sparkles">Erikois</option>
                          <option value="package">Muu</option>
                        </select>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowNewCategoryForm(false)}
                          className="px-3 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Peruuta
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          onClick={handleCreateCategory}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? 'Luodaan...' : 'Luo kategoria'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kuvaus</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Hinta (€)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Kesto (min)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  min="5"
                  step="5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kolikkopalkkio</label>
              <input
                type="number"
                value={formData.coinReward}
                onChange={(e) => setFormData(prev => ({ ...prev, coinReward: e.target.value }))}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Asiakkaat saavat tämän verran kolikoita varatessaan tämän palvelun
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Palvelu on varattavissa
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {service && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  Poista palvelu
                </button>
              )}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Peruuta
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Tallennetaan...
                    </div>
                  ) : (
                    'Tallenna'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceDialog;
