import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getVendor, updateVendor } from '../lib/db';
import type { Vendor } from '../types/database';
import { Clock, Save, Loader2 } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

const DAYS = [
  { id: 'monday', label: 'Maanantai' },
  { id: 'tuesday', label: 'Tiistai' },
  { id: 'wednesday', label: 'Keskiviikko' },
  { id: 'thursday', label: 'Torstai' },
  { id: 'friday', label: 'Perjantai' },
  { id: 'saturday', label: 'Lauantai' },
  { id: 'sunday', label: 'Sunnuntai' }
];

const VendorSettings = () => {
  const { currentUser } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    phone: '',
    coverImage: '',
    logoImage: '',
    operatingHours: {} as Vendor['operatingHours']
  });

  useEffect(() => {
    const loadVendorData = async () => {
      if (!currentUser) return;
      
      try {
        const vendorData = await getVendor(currentUser.uid);
        if (vendorData) {
          setVendor(vendorData);
          setFormData({
            businessName: vendorData.businessName,
            description: vendorData.description || '',
            address: vendorData.address,
            phone: vendorData.phone,
            coverImage: vendorData.coverImage || '',
            logoImage: vendorData.logoImage || '',
            operatingHours: vendorData.operatingHours
          });
        }
      } catch (err) {
        console.error('Error loading vendor:', err);
        setError('Virhe ladattaessa yrityksen tietoja');
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [currentUser]);

  const handleHoursChange = (day: string, type: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [type]: value
        }
      }
    }));
  };

  const handleImageUploaded = async (type: 'logo' | 'cover', url: string) => {
    try {
      if (!vendor) return;

      const updatedData = {
        ...vendor,
        [type === 'logo' ? 'logoImage' : 'coverImage']: url
      };

      await updateVendor(vendor.id, updatedData);
      setFormData(prev => ({
        ...prev,
        [type === 'logo' ? 'logoImage' : 'coverImage']: url
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating image:', err);
      setError('Virhe kuvan päivityksessä');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await updateVendor(vendor.id, {
        ...vendor,
        ...formData
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating vendor:', err);
      setError('Virhe tallennettaessa muutoksia');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Virhe!</h2>
          <p className="text-gray-600">Yritystietoja ei löytynyt</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Yrityksen asetukset</h1>
        <p className="mt-2 text-gray-600">Hallitse yrityksesi tietoja ja aukioloaikoja</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Images Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Kuvat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <ImageUpload
                type="logo"
                currentImage={formData.logoImage}
                onImageUploaded={(url) => handleImageUploaded('logo', url)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kansikuva</label>
              <ImageUpload
                type="cover"
                currentImage={formData.coverImage}
                onImageUploaded={(url) => handleImageUploaded('cover', url)}
              />
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Perustiedot</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Yrityksen nimi</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Puhelinnumero</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Osoite</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Kuvaus</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Clock className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Aukioloajat</h2>
          </div>
          
          <div className="space-y-4">
            {DAYS.map(day => (
              <div key={day.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium text-gray-700">{day.label}</label>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="time"
                      value={formData.operatingHours[day.id]?.open || '09:00'}
                      onChange={(e) => handleHoursChange(day.id, 'open', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="time"
                      value={formData.operatingHours[day.id]?.close || '17:00'}
                      onChange={(e) => handleHoursChange(day.id, 'close', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">Muutokset tallennettu onnistuneesti!</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Tallennetaan...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Tallenna muutokset
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorSettings;
