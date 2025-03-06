import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getVendor, getVendorAppointments, getVendorServices, updateVendor, getServiceCategories, initializeServiceCategories, createService, getDefaultServices } from '../lib/db';
import type { Vendor, Appointment, Service, ServiceCategory } from '../types/database';
import { Calendar, Clock, Settings, BarChart3, Package, Plus, Save, Loader2, MapPin, Phone, Mail, Globe, Clock3, Coins, Car, Armchair, Star, Sparkles, Store, Check, ChevronDown, Edit } from 'lucide-react';
import { geocodeAddress } from '../lib/maps';
import AppointmentCalendar from '../components/AppointmentCalendar';
import AppointmentDialog from '../components/AppointmentDialog';
import ServiceCard from '../components/ServiceCard';
import DefaultServices from '../components/DefaultServices';
import ImageUpload from '../components/ImageUpload';
import ServiceDialog from '../components/ServiceDialog';
import OperatingHours from '../components/OperatingHours';
import CategoryDialog from '../components/CategoryDialog';

type Tab = 'calendar' | 'services' | 'analytics' | 'settings';
type OperatingStatus = 'open' | 'closed' | '24h';

const VendorDashboard = () => {
  const { currentUser } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dayStatus, setDayStatus] = useState<Record<string, OperatingStatus>>({});

  const refreshCategories = async () => {
    if (vendor) {
      const serviceCategories = await getServiceCategories(vendor.id);
      setCategories(serviceCategories);
    }
  };

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    coverImage: '',
    logoImage: '',
    operatingHours: {} as Vendor['operatingHours']
  });

  useEffect(() => {
    const loadVendorData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const vendorData = await getVendor(currentUser.uid);
        if (vendorData) {
          setVendor(vendorData);
          setFormData({
            businessName: vendorData.businessName,
            description: vendorData.description || '',
            address: vendorData.address,
            city: vendorData.city || '',
            postalCode: vendorData.postalCode || '',
            phone: vendorData.phone,
            email: vendorData.email || '',
            website: vendorData.website || '',
            coverImage: vendorData.coverImage || '',
            logoImage: vendorData.logoImage || '',
            operatingHours: vendorData.operatingHours
          });

          const initialDayStatus: Record<string, OperatingStatus> = {};
          Object.entries(vendorData.operatingHours).forEach(([day, hours]) => {
            if (!hours || (hours.open === 'closed' && hours.close === 'closed')) {
              initialDayStatus[day] = 'closed';
            } else if (hours.open === '00:00' && hours.close === '23:59') {
              initialDayStatus[day] = '24h';
            } else {
              initialDayStatus[day] = 'open';
            }
          });
          setDayStatus(initialDayStatus);

          const vendorAppointments = await getVendorAppointments(vendorData.id);
          const vendorServices = await getVendorServices(vendorData.id);
          const serviceCategories = await getServiceCategories(vendorData.id);
          
          const formattedAppointments = vendorAppointments.map(appointment => ({
            ...appointment,
            date: new Date(appointment.date.seconds * 1000)
          }));
          
          setAppointments(formattedAppointments);
          setServices(vendorServices);
          setCategories(serviceCategories);
        }
      } catch (err) {
        console.error('Error loading vendor data:', err);
        setError('Virhe ladattaessa tietoja');
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [currentUser]);

  const handleSaveSettings = async () => {
    if (!vendor) return;

    // Validate required fields
    if (!formData.businessName.trim()) {
      setError('Yrityksen nimi on pakollinen');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Only geocode if we have a complete address
      let coordinates = null;
      if (formData.address && formData.postalCode && formData.city) {
        const fullAddress = `${formData.address}, ${formData.postalCode} ${formData.city}`;
        coordinates = await geocodeAddress(fullAddress);
      }

      // Clean up formData to remove any undefined values
      const cleanFormData = Object.fromEntries(
        Object.entries({
          ...formData,
          location: coordinates || undefined
        }).filter(([_, v]) => v !== undefined && v !== '')
      );

      await updateVendor(vendor.id, {
        ...vendor,
        ...cleanFormData,
        ...formData,
        updatedAt: new Date()
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

  const handleStatusChange = (day: string, status: OperatingStatus) => {
    setDayStatus(prev => ({ ...prev, [day]: status }));
    
    let newHours = { open: '', close: '' };
    if (status === 'closed') {
      newHours = { open: 'closed', close: 'closed' };
    } else if (status === '24h') {
      newHours = { open: '00:00', close: '23:59' };
    } else {
      // For 'open' status, keep the existing hours or set defaults
      const existingHours = formData.operatingHours[day];
      newHours = {
        open: existingHours?.open || '09:00',
        close: existingHours?.close || '17:00'
      };
    }

    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: newHours
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

  const tabs = [
    { id: 'calendar', label: 'Kalenteri', icon: <Calendar className="w-5 h-5" /> },
    { id: 'services', label: 'Palvelut', icon: <Package className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytiikka', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Asetukset', icon: <Settings className="w-5 h-5" /> }
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Virhe!</h2>
          <p className="text-gray-600">{error || 'Yritystietoja ei löytynyt'}</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900">Varauskalenteri</h2>
              <p className="mt-1 text-gray-600">Hallitse ja seuraa varauksia</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-blue-600">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <span className="text-2xl font-bold text-blue-700">
                      {appointments.filter(a => a.status === 'confirmed').length}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-blue-700">Tulevat varaukset</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-green-600">
                      <Clock className="h-8 w-8" />
                    </div>
                    <span className="text-2xl font-bold text-green-700">
                      {appointments.filter(a => a.status === 'completed').length}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-green-700">Valmiit varaukset</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-yellow-600">
                      <Star className="h-8 w-8" />
                    </div>
                    <span className="text-2xl font-bold text-yellow-700">
                      {vendor.rating || '-'}/5
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-yellow-700">Keskiarvo</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
            <AppointmentCalendar 
              vendor={vendor} 
              appointments={appointments}
              onAppointmentClick={setSelectedAppointment}
            />
            </div>
            {selectedAppointment && (
              <AppointmentDialog
                isOpen={!!selectedAppointment}
                onClose={() => setSelectedAppointment(null)}
                appointment={selectedAppointment}
                onStatusChange={() => {
                  // Refresh appointments after status change
                  getVendorAppointments(vendor.id).then(appointments => {
                    const formattedAppointments = appointments.map(appointment => ({
                      ...appointment,
                      date: new Date(appointment.date.seconds * 1000)
                    }));
                    setAppointments(formattedAppointments);
                  });
                }}
              />
            )}
          </div>
        );
      
      case 'services':
        return (
          <div>
            {/* Services Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Palvelut</h2>
                  <p className="mt-1 text-gray-600">Hallitse tarjoamiasi palveluita</p>
                </div>
                <button 
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => {
                    setEditingService(null);
                    setIsServiceDialogOpen(true);
                  }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Lisää palvelu
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-blue-600">
                      <Package className="h-8 w-8" />
                    </div>
                    <span className="text-2xl font-bold text-blue-700">
                      {services.length}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-blue-700">Palvelut yhteensä</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-green-600">
                      <Check className="h-8 w-8" />
                    </div>
                    <span className="text-2xl font-bold text-green-700">
                      {services.filter(s => s.available).length}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-green-700">Saatavilla</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-yellow-600">
                      <Coins className="h-8 w-8" />
                    </div>
                    <span className="text-2xl font-bold text-yellow-700">
                      {services.reduce((sum, service) => sum + service.coinReward, 0)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-yellow-700">Kolikot yhteensä</p>
                </div>
              </div>
            </div>

            {/* Services by Category */}
            <div className="space-y-4">
              {categories.map(category => {
                const categoryServices = services.filter(service => service.categoryId === category.id);
                
                return (
                  <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div
                      onClick={() => {
                        const element = document.getElementById(`category-${category.id}`); 
                        element?.classList.toggle('hidden');
                      }}
                      className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg">
                          {category.icon === 'car' && <Car className="w-5 h-5 text-blue-600" />}
                          {category.icon === 'armchair' && <Armchair className="w-5 h-5 text-blue-600" />}
                          {category.icon === 'star' && <Star className="w-5 h-5 text-blue-600" />}
                          {category.icon === 'sparkles' && <Sparkles className="w-5 h-5 text-blue-600" />}
                          {category.icon === 'package' && <Package className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-gray-900 flex items-center">
                            {category.name}
                            <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                          </h3>
                          <p className="text-sm text-gray-500">{categoryServices.length} palvelua</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="w-4 h-4" />
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    
                    <div id={`category-${category.id}`} className="hidden">
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryServices.map(service => (
                            <ServiceCard
                              key={service.id}
                              service={service}
                              onEdit={() => {
                                setEditingService(service);
                                setIsServiceDialogOpen(true);
                              }}
                            />
                          ))}
                        </div>
                        
                        {categoryServices.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p>Ei palveluita tässä kategoriassa</p>
                            <button
                              onClick={() => {
                                setEditingService(null);
                                setIsServiceDialogOpen(true);
                              }}
                              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Lisää palvelu
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {vendor && (
              <ServiceDialog
                isOpen={isServiceDialogOpen}
                onClose={() => {
                  setIsServiceDialogOpen(false);
                  setEditingService(null);
                }}
                service={editingService}
                vendorId={vendor.id}
                categories={categories}
                onServiceSaved={async () => {
                  await refreshCategories();
                  const updatedServices = await getVendorServices(vendor.id);
                  setServices(updatedServices);
                }}
              />
            )}
            {editingCategory && (
              <CategoryDialog
                isOpen={!!editingCategory}
                onClose={() => setEditingCategory(null)}
                category={editingCategory}
                onCategorySaved={async () => {
                  await refreshCategories();
                }}
              />
            )}
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900">Analytiikka</h2>
              <p className="mt-1 text-gray-600">Seuraa liiketoimintasi kehitystä</p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold">Varaukset tässä kuussa</h3>
                <p className="text-3xl font-bold mt-2 text-blue-700">
                  {appointments.filter(a => {
                    const now = new Date();
                    const appointmentDate = new Date(a.date);
                    return appointmentDate.getMonth() === now.getMonth();
                  }).length}
                </p>
                <div className="mt-4 flex items-center text-blue-600">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span className="text-sm">Tässä kuussa</span>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold">Suosituin palvelu</h3>
                <p className="text-3xl font-bold mt-2 text-green-700">
                  {services.length > 0 ? services[0].name : '-'}
                </p>
                <div className="mt-4 flex items-center text-green-600">
                  <Package className="h-5 w-5 mr-2" />
                  <span className="text-sm">Eniten varauksia</span>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold">Keskimääräinen arvio</h3>
                <p className="text-3xl font-bold mt-2 text-yellow-700">{vendor.rating || '-'}/5</p>
                <div className="mt-4 flex items-center text-yellow-600">
                  <Star className="h-5 w-5 mr-2" />
                  <span className="text-sm">{vendor.ratingCount || 0} arvostelua</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Asetukset</h2>
              <p className="mt-1 text-gray-600">Hallitse yrityksen asetuksia</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-6">Kuvat</h3>
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

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-6">Perustiedot</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Yrityksen nimi
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
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

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-6">Sijainti</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Katuosoite
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Esim. Esimerkkikatu 123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Kaupunki
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Esim. Helsinki"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Postinumero
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value.toUpperCase() }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Esim. 00100"
                    maxLength={5}
                    pattern="[0-9]{5}"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Syötä 5-numeroinen postinumero
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-6">Yhteystiedot</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Puhelinnumero
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Sähköposti
                    </span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Verkkosivusto
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>

            <OperatingHours
              operatingHours={formData.operatingHours}
              dayStatus={dayStatus}
              onStatusChange={handleStatusChange}
              onHoursChange={handleHoursChange}
            />

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

            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
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
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Stats */}
      {!vendor.verified && (
        <div className="bg-yellow-50 border-b border-yellow-100">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Yrityksesi odottaa vielä ylläpidon vahvistusta. Yritys ei näy hakutuloksissa ennen vahvistusta.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {vendor.businessName}
                </h1>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{vendor.address}, {vendor.postalCode} {vendor.city}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Store className="h-5 w-5 mr-2" />
                    <span>Y-tunnus: {vendor.businessId}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-5 w-5 mr-2" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-5 w-5 mr-2" />
                    <span>{vendor.email}</span>
                  </div>
                  {vendor.website && (
                    <div className="flex items-center text-gray-600">
                      <Globe className="h-5 w-5 mr-2" />
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {vendor.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:flex sm:space-x-6">
                <div className="text-center bg-white p-2 rounded-lg shadow-sm sm:shadow-none">
                  <div className="text-2xl font-bold text-blue-600">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </div>
                  <div className="text-sm text-gray-500">Tulevat varaukset</div>
                </div>
                <div className="text-center bg-white p-2 rounded-lg shadow-sm sm:shadow-none">
                  <div className="text-2xl font-bold text-green-600">
                    {services.filter(s => s.available).length}
                  </div>
                  <div className="text-sm text-gray-500">Aktiiviset palvelut</div>
                </div>
                <div className="text-center bg-white p-2 rounded-lg shadow-sm sm:shadow-none">
                  <div className="text-2xl font-bold text-yellow-600">
                    {vendor.rating || '-'}/5
                  </div>
                  <div className="text-sm text-gray-500">Arvosana</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm overflow-x-auto">
          <nav className="flex p-2 min-w-max" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 inline-flex items-center justify-center py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium text-sm transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <span className={`mr-3 transition-colors ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-6 sm:py-10">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard