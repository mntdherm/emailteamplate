import React, { useState } from 'react';
import { X, Loader2, Package, Car, Armchair, Star, Sparkles } from 'lucide-react';
import type { ServiceCategory } from '../types/database';
import { updateServiceCategory } from '../lib/db';

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: ServiceCategory;
  onCategorySaved: () => void;
}

const ICONS = [
  { id: 'car', label: 'Auto', icon: <Car className="w-5 h-5" /> },
  { id: 'armchair', label: 'Sisätilat', icon: <Armchair className="w-5 h-5" /> },
  { id: 'star', label: 'Premium', icon: <Star className="w-5 h-5" /> },
  { id: 'sparkles', label: 'Erikois', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'package', label: 'Muu', icon: <Package className="w-5 h-5" /> }
];

const CategoryDialog: React.FC<CategoryDialogProps> = ({ 
  isOpen, 
  onClose, 
  category,
  onCategorySaved 
}) => {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description,
    icon: category.icon
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      setError('Täytä kaikki kentät');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateServiceCategory(category.id, {
        ...category,
        name: formData.name,
        description: formData.description,
        icon: formData.icon
      });

      onCategorySaved();
      onClose();
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Virhe kategorian päivityksessä');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Muokkaa kategoriaa</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Kategorian nimi</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kuvaus</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kuvake</label>
              <div className="grid grid-cols-5 gap-2">
                {ICONS.map(icon => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: icon.id }))}
                    className={`p-3 rounded-lg flex flex-col items-center justify-center space-y-1 transition-colors ${
                      formData.icon === icon.id 
                        ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {icon.icon}
                    <span className="text-xs">{icon.label}</span>
                  </button>
                ))}
              </div>
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

            <div className="flex justify-end space-x-3">
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
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Tallennetaan...
                  </>
                ) : (
                  'Tallenna'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryDialog;
