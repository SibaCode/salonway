import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  where
} from 'firebase/firestore';
import { db } from '../../config/firebase';

const ClientsContent = ({ salonId, salonData }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientType, setClientType] = useState('all');
  
  // Colors from salon data
  const primaryColor = salonData?.primaryColor || '#007bff';
  const secondaryColor = salonData?.secondaryColor || '#6c757d';
  const primaryLight = `${primaryColor}20`;
  const secondaryLight = `${secondaryColor}20`;
  const borderColor = '#dee2e6';
  
//   useEffect(() => {
//     fetchClients();
//   }, [salonId]);
useEffect(() => {
  fetchClients();
}, [fetchClients]);
  const fetchClients = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'consultations'),
        where('salonId', '==', salonId)
      );
      
      const snapshot = await getDocs(q);
      const clientData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date
      clientData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      setClients(clientData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert('Error loading clients');
    } finally {
      setLoading(false);
    }
  };

  const addNewClient = async (clientData) => {
    try {
      const newClient = {
        salonId,
        salonName: salonData?.name || salonData?.salonName || 'Salon',
        clientName: clientData.name,
        clientPhone: clientData.phone,
        clientEmail: clientData.email || '',
        dateOfBirth: clientData.dateOfBirth || '',
        desiredService: clientData.service || '',
        specialRequests: clientData.notes || '',
        allergies: clientData.allergies || '',
        medicalConditions: clientData.medicalConditions || '',
        medications: clientData.medications || '',
        previousReactions: clientData.previousReactions || '',
        isPregnant: clientData.isPregnant || false,
        emergencyContact: clientData.emergencyContact || '',
        previousHistory: clientData.previousHistory || '',
        photoReference: clientData.photoReference || '',
        consentData: clientData.consentData || true,
        consentPhotos: clientData.consentPhotos || false,
        consentService: clientData.consentService || true,
        status: 'new',
        source: 'manual',
        createdAt: new Date(),
        date: clientData.visitDate || new Date().toISOString().split('T')[0],
        submittedAt: new Date().toISOString(),
        accessCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      };

      const docRef = await addDoc(collection(db, 'consultations'), newClient);
      
      setClients(prev => [{
        id: docRef.id,
        ...newClient
      }, ...prev]);
      
      setShowAddForm(false);
      alert('Client added successfully!');
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client');
    }
  };

  const updateClientStatus = async (clientId, newStatus) => {
    try {
      await updateDoc(doc(db, 'consultations', clientId), {
        status: newStatus
      });
      
      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, status: newStatus } : client
      ));
      
      if (selectedClient?.id === clientId) {
        setSelectedClient(prev => ({ ...prev, status: newStatus }));
      }
      alert('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const deleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteDoc(doc(db, 'consultations', clientId));
        setClients(prev => prev.filter(client => client.id !== clientId));
        if (selectedClient?.id === clientId) {
          setSelectedClient(null);
        }
        alert('Client deleted');
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Error deleting client');
      }
    }
  };

  const copyFormLink = () => {
    const formLink = `${window.location.origin}/client/${salonData?.id || salonId}`;
    navigator.clipboard.writeText(formLink);
    alert('Form link copied to clipboard!');
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = searchTerm === '' || 
      client.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.clientPhone?.includes(searchTerm) ||
      client.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesType = clientType === 'all' || 
      (clientType === 'form' && client.source !== 'manual') ||
      (clientType === 'manual' && client.source === 'manual');
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate stats
  const totalEntries = clients.length;
  const formSubmissions = clients.filter(c => c.source !== 'manual').length;
  const manualEntries = clients.filter(c => c.source === 'manual').length;
  const newClients = clients.filter(c => c.status === 'new').length;

  // Check if mobile
  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: isMobile ? '20px' : '24px', 
          fontWeight: '600', 
          margin: '0 0 4px 0',
          color: '#212529'
        }}>
          Client Management
        </h2>
        <p style={{ color: secondaryColor, fontSize: '14px', margin: 0 }}>
          Manage all clients and consultations
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          onClick={copyFormLink}
          style={{
            padding: isMobile ? '12px 16px' : '12px 24px',
            background: primaryColor,
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
          <span>📝</span>
          Copy Form Link
        </button>
        
        <button 
          onClick={() => setShowAddForm(true)}
          style={{
            padding: isMobile ? '12px 16px' : '12px 24px',
            background: '#28a745',
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
          <span>➕</span>
          Add New Client
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: secondaryColor }}>Total Clients</p>
          <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: primaryColor }}>
            {totalEntries}
          </h3>
        </div>
        
        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: secondaryColor }}>Form Submissions</p>
          <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: primaryColor }}>
            {formSubmissions}
          </h3>
        </div>
        
        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: secondaryColor }}>Manual Entries</p>
          <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#28a745' }}>
            {manualEntries}
          </h3>
        </div>
        
        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: secondaryColor }}>New</p>
          <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#ffc107' }}>
            {newClients}
          </h3>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search clients by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            minWidth: isMobile ? '100%' : '150px'
          }}
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="contacted">Contacted</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
        
        <select
          value={clientType}
          onChange={(e) => setClientType(e.target.value)}
          style={{
            padding: '12px 16px',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            minWidth: isMobile ? '100%' : '150px'
          }}
        >
          <option value="all">All Clients</option>
          <option value="form">Form Submissions</option>
          <option value="manual">Manual Entries</option>
        </select>
      </div>

      {/* Clients List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
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
            👥
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#6c757d' }}>
            {searchTerm ? 'No matching clients' : 'No Clients Yet'}
          </h3>
          <p style={{ color: '#adb5bd', fontSize: '14px', margin: '0 0 20px 0' }}>
            {searchTerm 
              ? 'Try adjusting your search' 
              : 'Add clients manually or share the form with clients'}
          </p>
          <button 
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ➕ Add First Client
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredClients.map(client => (
            <div 
              key={client.id}
              style={{
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setSelectedClient(client)}
              onMouseOver={(e) => e.currentTarget.style.borderColor = primaryColor}
              onMouseOut={(e) => e.currentTarget.style.borderColor = borderColor}
            >
              {isMobile ? (
                // Mobile layout
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: '#212529'
                      }}>
                        {client.clientName || 'Unknown Client'}
                      </h4>
                      <div style={{ fontSize: '14px', color: secondaryColor, marginTop: '4px' }}>
                        📞 {client.clientPhone || 'No phone'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: secondaryColor,
                        marginBottom: '4px'
                      }}>
                        {client.date || client.createdAt?.toDate?.().toLocaleDateString() || 'Recent'}
                      </div>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: client.status === 'new' ? '#fff3cd' :
                                   client.status === 'reviewed' ? '#d1ecf1' :
                                   client.status === 'scheduled' ? '#d4edda' :
                                   '#e2e3e5',
                        color: client.status === 'new' ? '#856404' :
                               client.status === 'reviewed' ? '#0c5460' :
                               client.status === 'scheduled' ? '#155724' :
                               '#383d41',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        {client.status || 'New'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        background: client.source === 'manual' ? secondaryLight : primaryLight,
                        color: client.source === 'manual' ? secondaryColor : primaryColor,
                        borderRadius: '4px'
                      }}>
                        {client.source === 'manual' ? 'Manual' : 'Form'}
                      </span>
                      {client.desiredService && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '13px',
                          color: secondaryColor
                        }}>
                          • {client.desiredService}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(client);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: primaryColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ) : (
                // Desktop layout
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                        {client.clientName || 'Unknown Client'}
                      </h4>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: client.source === 'manual' ? secondaryLight : primaryLight,
                        color: client.source === 'manual' ? secondaryColor : primaryColor,
                        borderRadius: '4px'
                      }}>
                        {client.source === 'manual' ? 'Manual' : 'Form'}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: secondaryColor }}>
                      📞 {client.clientPhone || 'No phone'} • ✉️ {client.clientEmail || 'No email'}
                    </div>
                    {client.desiredService && (
                      <div style={{ fontSize: '14px', color: '#495057', marginTop: '4px' }}>
                        Service: {client.desiredService}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: secondaryColor }}>
                      {client.date || client.createdAt?.toDate?.().toLocaleDateString() || 'Recent'}
                    </p>
                    <select
                      value={client.status || 'new'}
                      onChange={(e) => updateClientStatus(client.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px 10px',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '6px',
                        fontSize: '13px',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="contacted">Contacted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClient(client);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: primaryColor,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      marginLeft: '16px'
                    }}
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
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
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowAddForm(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: secondaryColor
              }}
            >
              ✕
            </button>
            
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#212529' }}>
              Add New Client
            </h3>
            
            <EnhancedAddClientForm 
              onSubmit={addNewClient}
              onCancel={() => setShowAddForm(false)}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              borderColor={borderColor}
            />
          </div>
        </div>
      )}

      {/* View Client Modal */}
      {selectedClient && (
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
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedClient(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: secondaryColor
              }}
            >
              ✕
            </button>
            
            <EnhancedClientDetails 
              client={selectedClient}
              onDelete={deleteClient}
              onClose={() => setSelectedClient(null)}
              onUpdateStatus={updateClientStatus}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              borderColor={borderColor}
              isMobile={isMobile}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Add Client Form with all fields
const EnhancedAddClientForm = ({ onSubmit, onCancel, primaryColor, secondaryColor, borderColor }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    service: '',
    visitDate: new Date().toISOString().split('T')[0],
    notes: '',
    allergies: '',
    medicalConditions: '',
    medications: '',
    previousReactions: '',
    isPregnant: false,
    emergencyContact: '',
    previousHistory: '',
    photoReference: '',
    consentPhotos: false,
    consentData: true,
    consentService: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Personal Information */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: `1px solid ${borderColor}` }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: primaryColor }}>
          Personal Information
        </h4>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Service Information */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: `1px solid ${borderColor}` }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: primaryColor }}>
          Service Information
        </h4>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Desired Service
          </label>
          <input
            type="text"
            value={formData.service}
            onChange={(e) => setFormData({...formData, service: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Visit Date
          </label>
          <input
            type="date"
            value={formData.visitDate}
            onChange={(e) => setFormData({...formData, visitDate: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Notes / Special Requests
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows="3"
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      {/* Medical Information */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: `1px solid ${borderColor}` }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: primaryColor }}>
          Medical Information
        </h4>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Allergies
          </label>
          <textarea
            value={formData.allergies}
            onChange={(e) => setFormData({...formData, allergies: e.target.value})}
            rows="2"
            placeholder="List any allergies..."
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Medical Conditions
          </label>
          <textarea
            value={formData.medicalConditions}
            onChange={(e) => setFormData({...formData, medicalConditions: e.target.value})}
            rows="2"
            placeholder="List any medical conditions..."
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Current Medications
          </label>
          <textarea
            value={formData.medications}
            onChange={(e) => setFormData({...formData, medications: e.target.value})}
            rows="2"
            placeholder="List current medications..."
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Previous Reactions to Treatments
          </label>
          <textarea
            value={formData.previousReactions}
            onChange={(e) => setFormData({...formData, previousReactions: e.target.value})}
            rows="2"
            placeholder="Describe any previous reactions..."
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="isPregnant"
            checked={formData.isPregnant}
            onChange={(e) => setFormData({...formData, isPregnant: e.target.checked})}
          />
          <label htmlFor="isPregnant" style={{ fontSize: '14px' }}>
            Pregnant or trying to conceive
          </label>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Emergency Contact
          </label>
          <input
            type="text"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
            placeholder="Name and phone number"
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Additional Information */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: primaryColor }}>
          Additional Information
        </h4>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Previous Treatment History
          </label>
          <textarea
            value={formData.previousHistory}
            onChange={(e) => setFormData({...formData, previousHistory: e.target.value})}
            rows="3"
            placeholder="Describe previous treatments, if any..."
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Photo Reference
          </label>
          <input
            type="text"
            value={formData.photoReference}
            onChange={(e) => setFormData({...formData, photoReference: e.target.value})}
            placeholder="URL or description of reference photo"
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="consentPhotos"
            checked={formData.consentPhotos}
            onChange={(e) => setFormData({...formData, consentPhotos: e.target.checked})}
          />
          <label htmlFor="consentPhotos" style={{ fontSize: '14px' }}>
            Consent to photos being taken
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '12px 24px',
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
          type="submit"
          style={{
            padding: '12px 24px',
            background: primaryColor,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Add Client
        </button>
      </div>
    </form>
  );
};

// Enhanced Client Details Component
const EnhancedClientDetails = ({ client, onDelete, onClose, onUpdateStatus, primaryColor, secondaryColor, borderColor, isMobile }) => {
  const isFormSubmission = client.source !== 'manual';

  // Format date
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Not provided';
    if (dateValue.toDate) {
      return dateValue.toDate().toLocaleDateString();
    }
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleDateString();
    }
    return 'Invalid date';
  };

  // Render data section
  const renderDataSection = (title, data, isMultiline = false) => {
    if (!data) return null;
    return (
      <div style={{ marginBottom: '16px' }}>
        <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: secondaryColor }}>
          {title}:
        </strong>
        {isMultiline ? (
          <div style={{
            padding: '8px',
            background: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#495057',
            whiteSpace: 'pre-wrap'
          }}>
            {data}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '14px', color: '#495057' }}>
            {data}
          </p>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Client Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#212529' }}>
              {client.clientName || 'Unknown Client'}
            </h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: secondaryColor, flexWrap: 'wrap' }}>
              <span>📞 {client.clientPhone || 'Not provided'}</span>
              <span>✉️ {client.clientEmail || 'Not provided'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
            <span style={{
              fontSize: '12px',
              padding: '4px 8px',
              background: client.source === 'manual' ? secondaryColor + '20' : primaryColor + '20',
              color: client.source === 'manual' ? secondaryColor : primaryColor,
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              {client.source === 'manual' ? 'Manual Entry' : 'Form Submission'}
            </span>
            <span style={{
              fontSize: '12px',
              padding: '4px 8px',
              background: client.status === 'new' ? '#fff3cd' :
                         client.status === 'reviewed' ? '#d1ecf1' :
                         client.status === 'scheduled' ? '#d4edda' :
                         '#e2e3e5',
              color: client.status === 'new' ? '#856404' :
                     client.status === 'reviewed' ? '#0c5460' :
                     client.status === 'scheduled' ? '#155724' :
                     '#383d41',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              {client.status || 'New'}
            </span>
          </div>
        </div>
      </div>

      {/* Client Information in Columns */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Personal Information Column */}
        <div>
          <h4 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: primaryColor,
            paddingBottom: '8px',
            borderBottom: `1px solid ${borderColor}`
          }}>
            Personal Information
          </h4>
          
          {renderDataSection('Phone', client.clientPhone)}
          {renderDataSection('Email', client.clientEmail)}
          {renderDataSection('Date of Birth', client.dateOfBirth)}
          {renderDataSection('Emergency Contact', client.emergencyContact)}
        </div>

        {/* Service Information Column */}
        <div>
          <h4 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: primaryColor,
            paddingBottom: '8px',
            borderBottom: `1px solid ${borderColor}`
          }}>
            Service Information
          </h4>
          
          {renderDataSection('Desired Service', client.desiredService)}
          {renderDataSection('Visit Date', client.date)}
          {renderDataSection('Special Requests', client.specialRequests, true)}
          {renderDataSection('Photo Reference', client.photoReference)}
        </div>
      </div>

      {/* Medical Information */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '16px', 
          fontWeight: '600',
          color: primaryColor,
          paddingBottom: '8px',
          borderBottom: `1px solid ${borderColor}`
        }}>
          Medical Information
        </h4>
        
        {renderDataSection('Allergies', client.allergies, true)}
        {renderDataSection('Medical Conditions', client.medicalConditions, true)}
        {renderDataSection('Medications', client.medications, true)}
        {renderDataSection('Previous Reactions', client.previousReactions, true)}
        
        {client.isPregnant && (
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: secondaryColor }}>
              Pregnancy Status:
            </strong>
            <p style={{ margin: 0, fontSize: '14px', color: '#495057' }}>
              ⚠️ Pregnant or trying to conceive
            </p>
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '16px', 
          fontWeight: '600',
          color: primaryColor,
          paddingBottom: '8px',
          borderBottom: `1px solid ${borderColor}`
        }}>
          Additional Information
        </h4>
        
        {renderDataSection('Previous Treatment History', client.previousHistory, true)}
        
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: secondaryColor }}>
            Consents:
          </strong>
          <div style={{ fontSize: '14px', color: '#495057' }}>
            <div>✓ Data Collection: {client.consentData ? 'Consented' : 'Not Consented'}</div>
            <div>✓ Photos: {client.consentPhotos ? 'Consented' : 'Not Consented'}</div>
            <div>✓ Service Agreement: {client.consentService ? 'Consented' : 'Not Consented'}</div>
          </div>
        </div>
      </div>

      {/* Form Responses (for form submissions) */}
      {isFormSubmission && client.consultationResponses && (
        <div style={{ 
          marginTop: '24px', 
          paddingTop: '16px', 
          borderTop: `1px solid ${borderColor}`
        }}>
          <h4 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px', 
            fontWeight: '600',
            color: primaryColor
          }}>
            Form Responses
          </h4>
          {Object.entries(client.consultationResponses).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '12px', fontSize: '14px' }}>
              <strong style={{ display: 'block', marginBottom: '2px', color: secondaryColor }}>
                {key}:
              </strong>
              <div style={{ 
                padding: '8px',
                background: '#f8f9fa',
                borderRadius: '4px',
                color: '#495057',
                whiteSpace: 'pre-wrap'
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div style={{ 
        marginTop: '24px', 
        paddingTop: '16px', 
        borderTop: `1px solid ${borderColor}`,
        fontSize: '13px', 
        color: secondaryColor 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span>Added: {formatDate(client.createdAt)}</span>
          <span>Submitted: {formatDate(client.submittedAt)}</span>
          <span>Access Code: {client.accessCode || 'N/A'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: `1px solid ${borderColor}`
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={client.status || 'new'}
            onChange={(e) => onUpdateStatus(client.id, e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white',
              minWidth: '120px'
            }}
          >
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this client?')) {
                onDelete(client.id);
              }
            }}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientsContent;