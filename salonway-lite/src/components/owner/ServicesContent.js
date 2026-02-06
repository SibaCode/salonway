import React, { useState, useEffect, useCallback } from 'react';
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
import { db } from '../../firebase';

const ServicesContent = ({ salonId, salonData = {}, ownerData = {} }) => {
  // State Management
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [viewMode, setViewMode] = useState('manage');

  // Form State
  const [newService, setNewService] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    duration: '30',
    imageUrl: '',
    isActive: true
  });

  // Catalogue Settings
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

  // ======================
  // UTILITY FUNCTIONS
  // ======================

  // Toast Notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    
    if (window.toastTimeout) {
      clearTimeout(window.toastTimeout);
    }
    
    window.toastTimeout = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // Error Logger
  const logError = (error, context) => {
    console.group('Service Management Error');
    console.log('Context:', context);
    console.log('Error:', error);
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  };

  // Network Status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (toast?.message?.includes('offline')) {
        showToast('Back online!', 'success');
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showToast('You are offline. Some features may not work.', 'warning');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, showToast]);

  // ======================
  // DATA FETCHING
  // ======================

  const fetchServices = useCallback(async () => {
    if (!isOnline) {
      showToast('Cannot load services while offline', 'warning');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const servicesSnapshot = await getDocs(collection(db, 'salons', salonId, 'services'));
      const servicesList = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesList);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(servicesList.map(service => service.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      // Set default category if none exists
      if (uniqueCategories.length > 0 && !newService.category) {
        setNewService(prev => ({ ...prev, category: uniqueCategories[0] }));
      }
    } catch (error) {
      logError(error, 'fetchServices');
      showToast('Failed to load services. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [salonId, isOnline, showToast]);

  const loadCatalogueSettings = useCallback(async () => {
    if (!isOnline) return;

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
  }, [salonId, isOnline]);

  useEffect(() => {
    fetchServices();
    loadCatalogueSettings();
  }, [fetchServices, loadCatalogueSettings]);

  // ======================
  // CATEGORY MANAGEMENT
  // ======================

  const filteredServices = activeCategory === 'All' 
    ? services 
    : services.filter(service => service.category === activeCategory);

  const handleAddCategory = () => {
    const categoryName = newCategoryName.trim();
    
    if (!categoryName) {
      showToast('Please enter a category name', 'error');
      return;
    }
    
    if (categories.includes(categoryName)) {
      showToast('Category already exists!', 'error');
      return;
    }
    
    setCategories(prev => [...prev, categoryName]);
    setNewService(prev => ({ ...prev, category: categoryName }));
    setNewCategoryName('');
    setShowAddCategory(false);
    showToast(`"${categoryName}" category added!`, 'success');
  };

  const handleDeleteCategory = (categoryToDelete) => {
    const servicesInCategory = services.filter(service => service.category === categoryToDelete);
    
    if (servicesInCategory.length > 0) {
      showToast(
        `Cannot delete category. ${servicesInCategory.length} service(s) are using it.`,
        'error'
      );
      return;
    }
    
    if (window.confirm(`Delete "${categoryToDelete}" category?`)) {
      setCategories(prev => prev.filter(cat => cat !== categoryToDelete));
      
      if (activeCategory === categoryToDelete) {
        setActiveCategory('All');
      }
      
      if (newService.category === categoryToDelete) {
        setNewService(prev => ({
          ...prev,
          category: categories.length > 1 ? categories.find(c => c !== categoryToDelete) || '' : ''
        }));
      }
      
      showToast(`"${categoryToDelete}" category deleted`, 'success');
    }
  };

  // ======================
  // SERVICE MANAGEMENT
  // ======================

  const validateServiceData = () => {
    if (!newService.name.trim()) {
      showToast('Please enter service name', 'error');
      return false;
    }

    const priceValue = parseFloat(newService.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      showToast('Please enter a valid price', 'error');
      return false;
    }

    if (categories.length > 0 && !newService.category) {
      showToast('Please select a category', 'error');
      return false;
    }

    return true;
  };

  const resetServiceForm = () => {
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
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 2MB for mobile)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB', 'error');
      return;
    }

    if (!file.type.match('image.*')) {
      showToast('Please select an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewService(prev => ({ ...prev, imageUrl: event.target.result }));
      showToast('Image uploaded!', 'success');
    };
    reader.onerror = () => {
      showToast('Failed to read image', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveService = async () => {
    if (isSaving || !isOnline) {
      showToast(isOnline ? 'Please wait...' : 'You are offline', 'warning');
      return;
    }

    if (!validateServiceData()) return;

    setIsSaving(true);

    try {
      const serviceData = {
        name: newService.name.trim(),
        category: newService.category || 'Uncategorized',
        description: newService.description.trim(),
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration) || 30,
        imageUrl: newService.imageUrl || '',
        isActive: true,
        createdAt: serverTimestamp(),
        salonId: salonId,
        updatedAt: serverTimestamp()
      };

      if (editingService) {
        await updateDoc(
          doc(db, 'salons', salonId, 'services', editingService.id),
          serviceData
        );
        showToast('Service updated successfully!', 'success');
      } else {
        await addDoc(
          collection(db, 'salons', salonId, 'services'),
          serviceData
        );
        showToast('Service added successfully!', 'success');
      }

      await fetchServices();
      resetServiceForm();

    } catch (error) {
      logError(error, 'saveService');
      
      let errorMessage = 'Failed to save service';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please contact support.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('invalid-argument')) {
        errorMessage = 'Invalid data. Please check all fields.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setNewService({
      name: service.name || '',
      category: service.category || (categories[0] || ''),
      description: service.description || '',
      price: service.price?.toString() || '',
      duration: service.duration?.toString() || '30',
      imageUrl: service.imageUrl || '',
      isActive: service.isActive !== false
    });
    setShowAddForm(true);
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (!window.confirm(`Are you sure you want to delete "${serviceName}"?`)) return;

    if (!isOnline) {
      showToast('Cannot delete service while offline', 'error');
      return;
    }

    try {
      await deleteDoc(doc(db, 'salons', salonId, 'services', serviceId));
      await fetchServices();
      showToast('Service deleted', 'success');
    } catch (error) {
      logError(error, 'deleteService');
      showToast('Failed to delete service. Please try again.', 'error');
    }
  };

  const handleToggleServiceStatus = async (service) => {
    if (!isOnline) {
      showToast('Cannot update service while offline', 'error');
      return;
    }

    try {
      const docRef = doc(db, 'salons', salonId, 'services', service.id);
      await updateDoc(docRef, { 
        isActive: !service.isActive,
        updatedAt: serverTimestamp()
      });
      await fetchServices();
      showToast(`Service ${service.isActive ? 'deactivated' : 'activated'}`, 'success');
    } catch (error) {
      logError(error, 'toggleServiceStatus');
      showToast('Failed to update service status', 'error');
    }
  };

  // ======================
  // CATALOGUE MANAGEMENT
  // ======================

  const saveCatalogueSettings = async () => {
    if (!isOnline) {
      showToast('Cannot save settings while offline', 'error');
      return;
    }

    try {
      await setDoc(
        doc(db, 'salons', salonId, 'catalogue', 'settings'),
        catalogueSettings
      );
      showToast('Catalogue settings saved!', 'success');
    } catch (error) {
      logError(error, 'saveCatalogueSettings');
      showToast('Failed to save settings', 'error');
    }
  };

  const getCatalogueLink = () => {
    return `${window.location.origin}/catalogue/${salonId}`;
  };

  const copyCatalogueLink = () => {
    navigator.clipboard.writeText(getCatalogueLink()).then(
      () => showToast('Catalogue link copied!', 'success'),
      () => showToast('Failed to copy link', 'error')
    );
  };

  // ======================
  // RENDER HELPERS
  // ======================

  const renderLoading = () => (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '300px'
    }}>
      <div className="spinner"></div>
      <p style={{ color: '#6c757d', marginTop: '16px' }}>Loading services...</p>
    </div>
  );

  const renderServiceCard = (service) => (
    <div key={service.id} className="service-card">
      <div className="service-image" style={{ 
        background: service.imageUrl ? `url(${service.imageUrl}) center/cover` : '#f8f9fa'
      }}>
        {!service.imageUrl && <div className="image-placeholder">💼</div>}
        <div className={`service-status ${service.isActive ? 'active' : 'inactive'}`}>
          {service.isActive ? 'ACTIVE' : 'INACTIVE'}
        </div>
      </div>

      <div className="service-details">
        <div className="service-header">
          <div className="service-info">
            <h4>{service.name}</h4>
            <div className="service-meta">
              <span className="category-badge">{service.category}</span>
              <span className="duration">{service.duration || 30} min</span>
            </div>
          </div>
          <div className="service-price">${service.price}</div>
        </div>

        {service.description && (
          <p className="service-description">
            {service.description.length > 80 
              ? `${service.description.substring(0, 80)}...` 
              : service.description}
          </p>
        )}

        <div className="service-actions">
          <button
            onClick={() => handleEditService(service)}
            className="btn-edit"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => handleToggleServiceStatus(service)}
            className={`btn-toggle ${service.isActive ? 'deactivate' : 'activate'}`}
          >
            {service.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
          </button>
          <button
            onClick={() => handleDeleteService(service.id, service.name)}
            className="btn-delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );

  const renderCategoryTabs = () => (
    <div className="category-tabs">
      <button
        onClick={() => setActiveCategory('All')}
        className={`category-tab ${activeCategory === 'All' ? 'active' : ''}`}
      >
        All Services ({services.length})
      </button>
      {categories.map(cat => {
        const count = services.filter(s => s.category === cat).length;
        return (
          <div key={cat} className="category-tab-wrapper">
            <button
              onClick={() => setActiveCategory(cat)}
              className={`category-tab ${activeCategory === cat ? 'active' : ''} ${count === 0 ? 'empty' : ''}`}
              disabled={count === 0}
            >
              {cat} ({count})
            </button>
            {count === 0 && (
              <button
                onClick={() => handleDeleteCategory(cat)}
                className="delete-category-btn"
                title="Delete category"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={() => setShowAddCategory(true)}
        className="add-category-btn"
      >
        <span>+</span> Add Category
      </button>
    </div>
  );

  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon">💼</div>
      <h3>No Services Yet</h3>
      <p>
        {activeCategory === 'All' 
          ? 'Create your first service to build your catalogue' 
          : `No services in the ${activeCategory} category`}
      </p>
      <button 
        onClick={() => setShowAddForm(true)}
        className="btn-primary"
      >
        {activeCategory === 'All' ? 'Create First Service' : `Add ${activeCategory} Service`}
      </button>
    </div>
  );

  const renderServiceForm = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{editingService ? 'Edit Service' : 'Add New Service'}</h3>
          <button onClick={resetServiceForm} className="close-btn">×</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Service Name *</label>
              <input
                type="text"
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Women's Haircut, Manicure, Facial"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label>Category *</label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setShowAddCategory(true);
                  }}
                  className="text-link"
                >
                  + Add New
                </button>
              </div>
              {categories.length > 0 ? (
                <select
                  value={newService.category}
                  onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                  className="form-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newService.category}
                  onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter category name"
                  className="form-input"
                />
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price ($) *</label>
                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="65"
                  inputMode="decimal"
                  step="0.01"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <select
                  value={newService.duration}
                  onChange={(e) => setNewService(prev => ({ ...prev, duration: e.target.value }))}
                  className="form-select"
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

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={newService.description}
                onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the service, what's included..."
                rows="3"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>Service Image (Optional)</label>
              <div className="image-upload-area" style={{ 
                background: newService.imageUrl ? `url(${newService.imageUrl}) center/cover` : '#f9fafb'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-upload-input"
                />
                {!newService.imageUrl ? (
                  <div className="upload-placeholder">
                    <div>📷</div>
                    <p>Click to upload image</p>
                    <small>For service catalog</small>
                  </div>
                ) : (
                  <div className="upload-overlay">
                    Change Image
                  </div>
                )}
              </div>
              {newService.imageUrl && (
                <button
                  onClick={() => setNewService(prev => ({ ...prev, imageUrl: '' }))}
                  className="btn-remove-image"
                >
                  Remove Image
                </button>
              )}
            </div>

            <div className="form-actions">
              <button onClick={resetServiceForm} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                disabled={isSaving}
                className={`btn-primary ${isSaving ? 'loading' : ''}`}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : editingService ? 'Update Service' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddCategoryModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Add New Category</h3>
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Enter category name (e.g., Waxing, Kids)"
          className="form-input"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
        />
        <div className="modal-actions">
          <button
            onClick={() => {
              setShowAddCategory(false);
              setNewCategoryName('');
            }}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleAddCategory}
            className="btn-primary"
          >
            Add Category
          </button>
        </div>
      </div>
    </div>
  );

  const renderToast = () => {
    if (!toast) return null;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    return (
      <div className={`toast toast-${toast.type}`}>
        <span className="toast-icon">{icons[toast.type] || 'ℹ️'}</span>
        <span className="toast-message">{toast.message}</span>
        <button onClick={() => setToast(null)} className="toast-close">
          ×
        </button>
      </div>
    );
  };

  // ======================
  // MAIN RENDER
  // ======================

  if (loading) {
    return renderLoading();
  }

  return (
    <div className="services-container">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h2>Services & Catalogue</h2>
          <p>
            {viewMode === 'manage' 
              ? 'Manage your services and organize them into categories' 
              : 'Preview how your catalogue looks to clients'}
          </p>
        </div>
        
        <div className="header-right">
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('manage')}
              className={`toggle-btn ${viewMode === 'manage' ? 'active' : ''}`}
            >
              💼 Manage
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
            >
              👁️ Preview
            </button>
          </div>
          
          {viewMode === 'manage' ? (
            <button onClick={() => setShowAddForm(true)} className="btn-primary">
              <span>➕</span> Add Service
            </button>
          ) : (
            <button onClick={copyCatalogueLink} className="btn-primary btn-blue">
              🔗 Copy Link
            </button>
          )}
        </div>
      </div>

      {/* Network Status */}
      {!isOnline && (
        <div className="network-status">
          <span>⚠️</span>
          <span>Offline Mode - Some features may be limited</span>
        </div>
      )}

      {/* Manage View */}
      {viewMode === 'manage' && (
        <>
          {renderCategoryTabs()}
          
          {filteredServices.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="services-grid">
              {filteredServices.map(renderServiceCard)}
            </div>
          )}
        </>
      )}

      {/* Preview View */}
      {viewMode === 'preview' && (
        <div className="preview-container">
          {/* Preview content would go here */}
          <p>Preview mode - Catalogue display would appear here</p>
          <button onClick={() => window.open(getCatalogueLink(), '_blank')} className="btn-primary">
            Open Catalogue
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddForm && renderServiceForm()}
      {showAddCategory && renderAddCategoryModal()}
      {renderToast()}

      {/* Styles */}
      <style jsx>{`
        .services-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Header Styles */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header-left h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .header-left p {
          color: #6c757d;
          font-size: 14px;
          margin: 0;
        }

        .header-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        /* View Toggle */
        .view-toggle {
          display: flex;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 4px;
          gap: 4px;
        }

        .toggle-btn {
          padding: 8px 16px;
          background: transparent;
          color: #495057;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .toggle-btn.active {
          background: var(--primary-color);
          color: white;
        }

        /* Buttons */
        .btn-primary {
          padding: 10px 16px;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s;
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-primary.loading {
          opacity: 0.8;
        }

        .btn-secondary {
          padding: 12px;
          background: #e9ecef;
          color: #495057;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          flex: 1;
        }

        .btn-blue {
          background: #3B82F6;
        }

        /* Category Tabs */
        .category-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          overflow-x: auto;
          padding-bottom: 10px;
          align-items: center;
        }

        .category-tab {
          padding: 8px 16px;
          background: white;
          color: #495057;
          border: 1px solid #e9ecef;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .category-tab.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .category-tab.empty {
          opacity: 0.5;
          padding-right: 32px;
        }

        .category-tab-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .delete-category-btn {
          position: absolute;
          right: 8px;
          background: transparent;
          border: none;
          color: #dc2626;
          cursor: pointer;
          font-size: 16px;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .add-category-btn {
          padding: 8px 16px;
          background: transparent;
          color: var(--primary-color);
          border: 2px dashed var(--primary-color);
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Services Grid */
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        /* Service Card */
        .service-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid #f1f3f4;
          transition: all 0.2s;
        }

        .service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .service-image {
          height: 160px;
          position: relative;
        }

        .image-placeholder {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 40px;
          color: #dee2e6;
        }

        .service-status {
          position: absolute;
          top: 12px;
          right: 12px;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .service-status.active {
          background: #10B981;
        }

        .service-status.inactive {
          background: #6c757d;
        }

        .service-details {
          padding: 16px;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .service-info {
          flex: 1;
        }

        .service-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .service-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .category-badge {
          font-size: 12px;
          background: #e9ecef;
          color: #495057;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .duration {
          font-size: 12px;
          color: #6c757d;
        }

        .service-price {
          font-size: 18px;
          font-weight: 700;
          color: var(--primary-color);
        }

        .service-description {
          font-size: 13px;
          color: #6c757d;
          margin: 8px 0 12px 0;
          line-height: 1.4;
        }

        .service-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .btn-edit, .btn-toggle, .btn-delete {
          padding: 8px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .btn-edit {
          flex: 1;
          background: #e9ecef;
          color: #495057;
        }

        .btn-toggle {
          flex: 1;
        }

        .btn-toggle.deactivate {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn-toggle.activate {
          background: #d1fae5;
          color: #065f46;
        }

        .btn-delete {
          padding: 8px 12px;
          background: #fee2e2;
          color: #dc2626;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px dashed #dee2e6;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: #e9ecef;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin: 0 auto 20px;
          color: #6c757d;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #6c757d;
        }

        .empty-state p {
          color: #adb5bd;
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        /* Forms */
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          font-family: inherit;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .text-link {
          background: transparent;
          border: none;
          color: var(--primary-color);
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Image Upload */
        .image-upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background-size: cover;
          background-position: center;
        }

        .image-upload-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .upload-placeholder {
          color: #6b7280;
        }

        .upload-placeholder div {
          font-size: 32px;
          color: #9ca3af;
          margin-bottom: 8px;
        }

        .upload-placeholder p {
          margin: 0;
          font-size: 14px;
        }

        .upload-placeholder small {
          margin: 4px 0 0 0;
          color: #9ca3af;
          font-size: 12px;
        }

        .upload-overlay {
          background: rgba(0,0,0,0.5);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
        }

        .btn-remove-image {
          margin-top: 8px;
          padding: 8px 16px;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6c757d;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        /* Toast */
        .toast {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          padding: 12px 20px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 280px;
          max-width: 90%;
          animation: slideUp 0.3s ease;
        }

        .toast-success {
          background: #10B981;
        }

        .toast-error {
          background: #EF4444;
        }

        .toast-warning {
          background: #F59E0B;
        }

        .toast-icon {
          font-size: 18px;
        }

        .toast-message {
          font-size: 14px;
          font-weight: 500;
          flex: 1;
        }

        .toast-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
        }

        /* Network Status */
        .network-status {
          background: #F59E0B;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
        }

        /* Loading Spinners */
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
          margin-right: 8px;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

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

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .header {
            flex-direction: column;
          }
          
          .header-right {
            width: 100%;
            justify-content: space-between;
          }
          
          .services-grid {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .service-actions {
            flex-wrap: wrap;
          }
          
          .btn-edit, .btn-toggle {
            flex: none;
            width: calc(50% - 4px);
          }
          
          .btn-delete {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .services-container {
            padding: 16px;
          }
          
          .category-tabs {
            flex-direction: column;
            align-items: stretch;
          }
          
          .category-tab {
            text-align: center;
          }
          
          .modal {
            margin: 10px;
          }
          
          .toast {
            width: calc(100% - 32px);
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default ServicesContent;