import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// import { db } from './firebase'; // Adjust this import based on your setup

const ServicesContent = ({ salonId, salonData = {}, ownerData = {} }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [toast, setToast] = useState(null);
  
  // Catalogue settings
  const [catalogueSettings, setCatalogueSettings] = useState({
    showContactInfo: true,
    showBusinessHours: true,
    showServices: true,
    showAboutSection: true,
    salonDescription: salonData.description || '',
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '10:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    },
    contactEmail: ownerData.email || '',
    contactPhone: salonData.phone || '',
    address: salonData.address || '',
    logoUrl: salonData.logoUrl || ''
  });

  const [newService, setNewService] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    duration: '30',
    imageUrl: '',
    isActive: true
  });

  // View mode: 'manage' or 'preview'
  const [viewMode, setViewMode] = useState('manage');

  // Simple toast function
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter services based on active category
  const filteredServices = activeCategory === 'All' 
    ? services 
    : services.filter(service => service.category === activeCategory);

  useEffect(() => {
    fetchServices();
    loadCatalogueSettings();
  }, [salonId]);

  const fetchServices = async () => {
    try {
      const servicesSnapshot = await getDocs(collection(db, 'salons', salonId, 'services'));
      const servicesList = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesList);
      
      // Extract unique categories from services
      const uniqueCategories = [...new Set(servicesList.map(service => service.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching services:', error);
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogueSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'salons', salonId, 'catalogue', 'settings'));
      if (settingsDoc.exists()) {
        setCatalogueSettings(prev => ({
          ...prev,
          ...settingsDoc.data()
        }));
      }
    } catch (error) {
      console.log('No catalogue settings found, using defaults');
    }
  };

  const saveCatalogueSettings = async () => {
    try {
      await setDoc(doc(db, 'salons', salonId, 'catalogue', 'settings'), catalogueSettings);
      showToast('Catalogue settings saved!', 'success');
    } catch (error) {
      console.error('Error saving catalogue settings:', error);
      showToast('Failed to save settings', 'error');
    }
  };

  // Get public catalogue link
  const getCatalogueLink = () => {
    return `${window.location.origin}/catalogue/${salonId}`;
  };

  const copyCatalogueLink = () => {
    navigator.clipboard.writeText(getCatalogueLink());
    showToast('Catalogue link copied!', 'success');
  };

  // Add new category
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      showToast('Please enter a category name', 'error');
      return;
    }
    
    const categoryName = newCategoryName.trim();
    
    // Check if category already exists
    if (categories.includes(categoryName)) {
      showToast('Category already exists!', 'error');
      return;
    }
    
    // Add to categories list
    setCategories(prev => [...prev, categoryName]);
    
    // If this is the first category, set it as default
    if (categories.length === 0) {
      setNewService(prev => ({ ...prev, category: categoryName }));
    }
    
    setNewCategoryName('');
    setShowAddCategory(false);
    showToast(`"${categoryName}" category added!`);
  };

  // Delete category (only if no services use it)
  const handleDeleteCategory = (categoryToDelete) => {
    // Check if any services use this category
    const servicesInCategory = services.filter(service => service.category === categoryToDelete);
    
    if (servicesInCategory.length > 0) {
      showToast(`Cannot delete "${categoryToDelete}" category. ${servicesInCategory.length} service(s) are using it. Please reassign or delete those services first.`, 'error');
      return;
    }
    
    if (window.confirm(`Delete "${categoryToDelete}" category?`)) {
      setCategories(prev => prev.filter(cat => cat !== categoryToDelete));
      
      // If the deleted category was selected, switch to "All"
      if (activeCategory === categoryToDelete) {
        setActiveCategory('All');
      }
      
      // If the deleted category was selected in newService, switch to first category or empty
      if (newService.category === categoryToDelete) {
        setNewService(prev => ({ ...prev, category: categories.length > 1 ? categories[0] : '' }));
      }
      
      showToast(`"${categoryToDelete}" category deleted`);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    // Check file type
    if (!file.type.match('image.*')) {
      showToast('Please select an image file', 'error');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewService({...newService, imageUrl: reader.result});
        showToast('Image uploaded!');
      };
      reader.onerror = () => {
        showToast('Failed to read image', 'error');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast('Failed to upload image', 'error');
    }
  };

  const handleSaveService = async () => {
    if (!newService.name.trim()) {
      showToast('Please enter service name', 'error');
      return;
    }

    if (!newService.price) {
      showToast('Please enter price', 'error');
      return;
    }

    if (!newService.category && categories.length > 0) {
      showToast('Please select a category', 'error');
      return;
    }

    try {
      const serviceData = {
        name: newService.name.trim(),
        category: newService.category || 'Uncategorized',
        description: newService.description.trim() || '',
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration) || 30,
        imageUrl: newService.imageUrl || '',
        isActive: true,
        createdAt: serverTimestamp(),
        salonId: salonId
      };

      if (editingService) {
        // Update existing service
        await updateDoc(doc(db, 'salons', salonId, 'services', editingService.id), serviceData);
        showToast('Service updated!');
      } else {
        // Add new service
        await addDoc(collection(db, 'salons', salonId, 'services'), serviceData);
        showToast('Service added!');
      }

      // Refresh and reset
      await fetchServices();
      setNewService({
        name: '',
        category: categories.length > 0 ? categories[0] : '',
        description: '',
        price: '',
        duration: '30',
        imageUrl: '',
        isActive: true
      });
      setEditingService(null);
      setShowAddForm(false);

    } catch (error) {
      console.error('Error saving service:', error);
      showToast('Failed to save service. Please try again.', 'error');
    }
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (!window.confirm(`Delete "${serviceName}"?`)) return;

    try {
      await deleteDoc(doc(db, 'salons', salonId, 'services', serviceId));
      await fetchServices();
      showToast('Service deleted');
    } catch (error) {
      console.error('Error deleting service:', error);
      showToast('Failed to delete service.', 'error');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      category: service.category || '',
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration?.toString() || '30',
      imageUrl: service.imageUrl || '',
      isActive: service.isActive !== false
    });
    setShowAddForm(true);
  };

  const handleToggleServiceStatus = async (service) => {
    try {
      const docRef = doc(db, 'salons', salonId, 'services', service.id);
      await updateDoc(docRef, { isActive: !service.isActive });
      await fetchServices();
      showToast(`Service ${service.isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      console.error('Error toggling service status:', error);
      showToast('Failed to update service status', 'error');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For now, use base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setCatalogueSettings(prev => ({
        ...prev,
        logoUrl: reader.result
      }));
      showToast('Logo uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '300px',
        padding: '40px 20px' 
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6c757d', marginTop: '16px' }}>Loading services...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header with View Mode Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Services & Catalogue
          </h2>
          <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>
            {viewMode === 'manage' 
              ? 'Manage your services and organize them into categories' 
              : 'Preview how your catalogue looks to clients'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '4px',
            gap: '4px'
          }}>
            <button
              onClick={() => setViewMode('manage')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'manage' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'manage' ? 'white' : '#495057',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              💼 Manage
            </button>
            <button
              onClick={() => setViewMode('preview')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'preview' ? 'var(--primary-color)' : 'transparent',
                color: viewMode === 'preview' ? 'white' : '#495057',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              👁️ Preview
            </button>
          </div>
          
          {/* Action Buttons based on view mode */}
          {viewMode === 'manage' ? (
            <button 
              onClick={() => setShowAddForm(true)}
              style={{
                padding: '10px 16px',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>➕</span> Add Service
            </button>
          ) : (
            <button 
              onClick={copyCatalogueLink}
              style={{
                padding: '10px 16px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔗 Copy Link
            </button>
          )}
        </div>
      </div>

      {/* MANAGE VIEW */}
      {viewMode === 'manage' && (
        <>
          {/* Category Filter Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '20px',
            overflowX: 'auto',
            paddingBottom: '10px',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setActiveCategory('All')}
              style={{
                padding: '8px 16px',
                background: activeCategory === 'All' ? 'var(--primary-color)' : 'white',
                color: activeCategory === 'All' ? 'white' : '#495057',
                border: '1px solid #e9ecef',
                borderRadius: '20px',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              All Services ({services.length})
            </button>
            {categories.map(cat => {
              const count = services.filter(s => s.category === cat).length;
              return (
                <div key={cat} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '8px 16px',
                      background: activeCategory === cat ? 'var(--primary-color)' : 'white',
                      color: activeCategory === cat ? 'white' : '#495057',
                      border: '1px solid #e9ecef',
                      borderRadius: '20px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      opacity: count === 0 ? 0.5 : 1,
                      paddingRight: '32px'
                    }}
                    disabled={count === 0}
                  >
                    {cat} ({count})
                  </button>
                  {count === 0 && (
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete category"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            
            {/* Add Category Button */}
            <button
              onClick={() => setShowAddCategory(true)}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: 'var(--primary-color)',
                border: '2px dashed var(--primary-color)',
                borderRadius: '20px',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Add new category"
            >
              <span style={{ fontSize: '18px' }}>+</span> Add Category
            </button>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '2px dashed #dee2e6'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: '#e9ecef',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                margin: '0 auto 20px',
                color: '#6c757d'
              }}>
                💼
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#6c757d' }}>
                No Services Yet
              </h3>
              <p style={{ color: '#adb5bd', fontSize: '14px', margin: '0 0 20px 0' }}>
                {activeCategory === 'All' 
                  ? 'Create your first service to build your catalogue' 
                  : `No services in the ${activeCategory} category`}
              </p>
              <button 
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '12px 24px',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {activeCategory === 'All' ? 'Create First Service' : `Add ${activeCategory} Service`}
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {filteredServices.map(service => (
                <div 
                  key={service.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: '1px solid #f1f3f4',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* Service Image */}
                  <div style={{
                    height: '160px',
                    background: service.imageUrl ? `url(${service.imageUrl}) center/cover` : '#f8f9fa',
                    position: 'relative'
                  }}>
                    {!service.imageUrl && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '40px',
                        color: '#dee2e6'
                      }}>
                        💼
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: service.isActive ? '#10B981' : '#6c757d',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                  </div>

                  {/* Service Details */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '16px', 
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>
                          {service.name}
                        </h4>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            fontSize: '12px',
                            background: '#e9ecef',
                            color: '#495057',
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}>
                            {service.category}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            color: '#6c757d'
                          }}>
                            {service.duration || 30} min
                          </span>
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '700',
                        color: 'var(--primary-color)'
                      }}>
                        ${service.price}
                      </div>
                    </div>

                    {service.description && (
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#6c757d',
                        margin: '8px 0 12px 0',
                        lineHeight: '1.4'
                      }}>
                        {service.description.length > 80 
                          ? `${service.description.substring(0, 80)}...` 
                          : service.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px',
                      marginTop: '12px'
                    }}>
                      <button
                        onClick={() => handleEditService(service)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#e9ecef',
                          color: '#495057',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleToggleServiceStatus(service)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: service.isActive ? '#fee2e2' : '#d1fae5',
                          color: service.isActive ? '#dc2626' : '#065f46',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {service.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id, service.name)}
                        style={{
                          padding: '8px 12px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* PREVIEW VIEW */}
      {viewMode === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Preview Header */}
          <div className="content-card" style={{ 
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👁️ Live Preview
            </h3>
            <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '16px' }}>
              Your clients will see this at: <code style={{ background: '#f8f9fa', padding: '4px 8px', borderRadius: '4px' }}>{getCatalogueLink()}</code>
            </p>
            
            <div style={{ 
              border: '2px solid #e9ecef', 
              borderRadius: '12px', 
              overflow: 'hidden',
              background: 'white',
              marginBottom: '20px'
            }}>
              {/* Preview Header */}
              <div style={{
                background: 'linear-gradient(135deg, var(--primary-color), #6d28d9)',
                color: 'white',
                padding: '24px',
                textAlign: 'center'
              }}>
                {catalogueSettings.logoUrl ? (
                  <img 
                    src={catalogueSettings.logoUrl} 
                    alt="Salon Logo" 
                    style={{ 
                      height: '80px', 
                      marginBottom: '16px',
                      borderRadius: '8px',
                      background: 'white',
                      padding: '8px'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    margin: '0 auto 16px'
                  }}>
                    ✂️
                  </div>
                )}
                <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600' }}>
                  {salonData?.name || 'Your Salon'}
                </h3>
                {catalogueSettings.showAboutSection && catalogueSettings.salonDescription && (
                  <p style={{ 
                    margin: '0 auto', 
                    maxWidth: '600px',
                    opacity: 0.9,
                    fontSize: '14px'
                  }}>
                    {catalogueSettings.salonDescription.substring(0, 120)}...
                  </p>
                )}
              </div>

              {/* Preview Content */}
              <div style={{ padding: '24px' }}>
                {/* Contact Info Preview */}
                {catalogueSettings.showContactInfo && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#1a1a1a' }}>
                      Contact Information
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      {catalogueSettings.contactPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>📞</span>
                          <span>{catalogueSettings.contactPhone}</span>
                        </div>
                      )}
                      {catalogueSettings.contactEmail && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>📧</span>
                          <span>{catalogueSettings.contactEmail}</span>
                        </div>
                      )}
                      {catalogueSettings.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>📍</span>
                          <span>{catalogueSettings.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Business Hours Preview */}
                {catalogueSettings.showBusinessHours && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#1a1a1a' }}>
                      Business Hours
                    </h4>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '8px'
                    }}>
                      {Object.entries(catalogueSettings.businessHours).map(([day, hours]) => (
                        <div key={day} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          padding: '8px',
                          background: hours.closed ? '#f8f9fa' : 'white',
                          borderRadius: '6px',
                          border: '1px solid #e9ecef'
                        }}>
                          <span style={{ 
                            textTransform: 'capitalize',
                            fontWeight: '500'
                          }}>
                            {day}
                          </span>
                          {hours.closed ? (
                            <span style={{ color: '#dc2626' }}>Closed</span>
                          ) : (
                            <span>{hours.open} - {hours.close}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services Preview */}
                {catalogueSettings.showServices && (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <h4 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>
                        Our Services
                      </h4>
                      <span style={{ fontSize: '14px', color: '#6c757d' }}>
                        {services.filter(s => s.isActive).length} services available
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                      gap: '16px'
                    }}>
                      {services.slice(0, 6).map(service => service.isActive && (
                        <div key={service.id} style={{
                          padding: '16px',
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e9ecef',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            {service.imageUrl ? (
                              <div style={{
                                width: '60px',
                                height: '60px',
                                background: `url(${service.imageUrl}) center/cover`,
                                borderRadius: '6px',
                                flexShrink: 0
                              }}></div>
                            ) : (
                              <div style={{
                                width: '60px',
                                height: '60px',
                                background: '#f8f9fa',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                color: '#adb5bd'
                              }}>
                                💇
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                              <h5 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
                                {service.name}
                              </h5>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <span style={{ 
                                  fontSize: '12px', 
                                  background: '#e9ecef',
                                  color: '#495057',
                                  padding: '2px 8px',
                                  borderRadius: '12px'
                                }}>
                                  {service.category}
                                </span>
                                <span style={{ 
                                  fontSize: '16px', 
                                  fontWeight: '600',
                                  color: 'var(--primary-color)'
                                }}>
                                  ${service.price}
                                </span>
                              </div>
                              {service.description && (
                                <p style={{ 
                                  margin: '8px 0 0 0', 
                                  fontSize: '12px', 
                                  color: '#6c757d',
                                  lineHeight: 1.4
                                }}>
                                  {service.description.substring(0, 60)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {services.length > 6 && (
                      <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button style={{
                          padding: '10px 24px',
                          background: 'white',
                          color: 'var(--primary-color)',
                          border: '2px solid var(--primary-color)',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}>
                          View All Services
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => window.open(getCatalogueLink(), '_blank')}
                style={{
                  padding: '12px 24px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                👁️ Open in New Tab
              </button>
              
              <button 
                onClick={copyCatalogueLink}
                style={{
                  padding: '12px 24px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔗 Copy Link
              </button>
              
              <button 
                onClick={() => setViewMode('manage')}
                style={{
                  padding: '12px 24px',
                  background: '#f8f9fa',
                  color: '#495057',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ⚙️ Edit Catalogue Settings
              </button>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="content-card" style={{ 
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚙️ Quick Settings
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>Show Contact Info</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>Phone, email, address</p>
                </div>
                <input
                  type="checkbox"
                  checked={catalogueSettings.showContactInfo}
                  onChange={(e) => setCatalogueSettings(prev => ({ ...prev, showContactInfo: e.target.checked }))}
                  style={{ width: '20px', height: '20px' }}
                />
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>Show Business Hours</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>Operating hours</p>
                </div>
                <input
                  type="checkbox"
                  checked={catalogueSettings.showBusinessHours}
                  onChange={(e) => setCatalogueSettings(prev => ({ ...prev, showBusinessHours: e.target.checked }))}
                  style={{ width: '20px', height: '20px' }}
                />
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>Show Services</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>Service menu</p>
                </div>
                <input
                  type="checkbox"
                  checked={catalogueSettings.showServices}
                  onChange={(e) => setCatalogueSettings(prev => ({ ...prev, showServices: e.target.checked }))}
                  style={{ width: '20px', height: '20px' }}
                />
              </label>
            </div>
            
            <button 
              onClick={saveCatalogueSettings}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              💾 Save Catalogue Settings
            </button>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
              Add New Category
            </h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name (e.g., Waxing, Kids)"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '16px'
              }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#e9ecef',
                  color: '#495057',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingService(null);
                  setNewService({
                    name: '',
                    category: categories.length > 0 ? categories[0] : '',
                    description: '',
                    price: '',
                    duration: '30',
                    imageUrl: '',
                    isActive: true
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Service Name */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                    placeholder="e.g., Women's Haircut, Manicure, Facial"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    autoFocus
                  />
                </div>

                {/* Category */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ 
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setShowAddCategory(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-color)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>+</span> Add New
                    </button>
                  </div>
                  {categories.length > 0 ? (
                    <select
                      value={newService.category}
                      onChange={(e) => setNewService({...newService, category: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'white'
                      }}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newService.category}
                      onChange={(e) => setNewService({...newService, category: e.target.value})}
                      placeholder="Enter category name"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  )}
                </div>

                {/* Price & Duration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({...newService, price: e.target.value})}
                      placeholder="65"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Duration (minutes)
                    </label>
                    <select
                      value={newService.duration}
                      onChange={(e) => setNewService({...newService, duration: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'white'
                      }}
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                      <option value="120">120 min</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={newService.description}
                    onChange={(e) => setNewService({...newService, description: e.target.value})}
                    placeholder="Describe the service, what's included..."
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    Service Image (Optional)
                  </label>
                  <div style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: newService.imageUrl ? `url(${newService.imageUrl}) center/cover` : '#f9fafb',
                    height: '150px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    {!newService.imageUrl ? (
                      <div>
                        <div style={{ fontSize: '32px', color: '#9ca3af', marginBottom: '8px' }}>
                          📷
                        </div>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                          Click to upload image
                        </p>
                        <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
                          For service catalog
                        </p>
                      </div>
                    ) : (
                      <div style={{ 
                        background: 'rgba(0,0,0,0.5)', 
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px'
                      }}>
                        Change Image
                      </div>
                    )}
                  </div>
                  {newService.imageUrl && (
                    <button
                      onClick={() => setNewService({...newService, imageUrl: ''})}
                      style={{
                        marginTop: '8px',
                        padding: '8px 16px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingService(null);
                      setNewService({
                        name: '',
                        category: categories.length > 0 ? categories[0] : '',
                        description: '',
                        price: '',
                        duration: '30',
                        imageUrl: '',
                        isActive: true
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#e9ecef',
                      color: '#495057',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveService}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {editingService ? 'Update Service' : 'Add Service'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#10B981' : 
                    toast.type === 'error' ? '#EF4444' : 
                    toast.type === 'warning' ? '#F59E0B' : '#3B82F6',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minWidth: '280px',
          maxWidth: '90%',
          animation: 'slideUp 0.3s ease'
        }}>
          <span style={{ fontSize: '18px' }}>
            {toast.type === 'success' ? '✅' :
             toast.type === 'error' ? '❌' :
             toast.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '500', flex: 1 }}>
            {toast.message}
          </span>
          <button 
            onClick={() => setToast(null)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default ServicesContent;