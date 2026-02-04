// CataloguePage.js - SIMPLE & CLEAN
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { MapPin, Phone, Clock, Scissors, MessageCircle } from 'lucide-react';

const CataloguePage = () => {
  const { salonId } = useParams();
  const [salonData, setSalonData] = useState(null);
  const [services, setServices] = useState([]);
  const [catalogueSettings, setCatalogueSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchCatalogueData();
  }, [salonId]);

  const fetchCatalogueData = async () => {
    try {
      const salonDoc = await getDoc(doc(db, 'salons', salonId));
      if (salonDoc.exists()) {
        setSalonData({ id: salonDoc.id, ...salonDoc.data() });
      }

      const settingsDoc = await getDoc(doc(db, 'salons', salonId, 'catalogue', 'settings'));
      if (settingsDoc.exists()) {
        setCatalogueSettings(settingsDoc.data());
      }

      const servicesSnapshot = await getDocs(collection(db, 'salons', salonId, 'services'));
      const servicesList = servicesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(service => service.isActive !== false);
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching catalogue data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use salon's custom colors
  const colors = {
    primary: salonData?.primaryColor || '#8B5CF6',
    secondary: salonData?.secondaryColor || '#F59E0B',
    dark: '#111827',
    light: '#F9FAFB',
    text: '#4B5563',
    white: '#FFFFFF',
    whatsapp: '#25D366'
  };

  // Categories and filtering
  const categories = ['All', ...new Set(services.map(service => service.category).filter(Boolean))];
  const filteredServices = activeCategory === 'All' 
    ? services 
    : services.filter(service => service.category === activeCategory);

  // WhatsApp function
  const openWhatsApp = (message = '') => {
    const phone = catalogueSettings?.contactPhone?.replace(/\D/g, '');
    if (phone) {
      const text = encodeURIComponent(message);
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    }
  };

  const handleServiceClick = (service) => {
    const message = `Hi ${salonData?.name || 'there'}! I'd like to book: ${service.name} for $${service.price}.`;
    openWhatsApp(message);
  };

  const handleContactClick = () => {
    openWhatsApp(`Hi ${salonData?.name || 'there'}! I'd like to book an appointment.`);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.light
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${colors.light}`,
          borderTop: `3px solid ${colors.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!salonData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.light,
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <Scissors size={40} color={colors.text} />
          <h2 style={{ color: colors.dark, marginTop: '16px', fontSize: '18px' }}>Salon Not Found</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.white,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: colors.text
    }}>
      {/* HEADER - Minimal */}
      <header style={{
        padding: '24px 20px',
        textAlign: 'center',
        borderBottom: `1px solid #f3f4f6`
      }}>
        {catalogueSettings?.logoUrl ? (
          <img 
            src={catalogueSettings.logoUrl} 
            alt={salonData.name} 
            style={{
              height: '50px',
              marginBottom: '12px',
              objectFit: 'contain'
            }}
          />
        ) : (
          <div style={{
            width: '50px',
            height: '50px',
            margin: '0 auto 12px',
            background: colors.primary,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.white
          }}>
            <Scissors size={24} />
          </div>
        )}
        
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: colors.dark,
          margin: '0 0 4px 0'
        }}>
          {salonData.name}
        </h1>
        
        {salonData.tagline && (
          <p style={{
            fontSize: '14px',
            color: colors.primary,
            fontWeight: '500',
            margin: 0
          }}>
            {salonData.tagline}
          </p>
        )}
      </header>

      {/* CATEGORY FILTER */}
      {categories.length > 1 && (
        <div style={{
          padding: '16px 20px',
          background: colors.white,
          borderBottom: `1px solid #f3f4f6`
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}>
            <style>{`
              ::-webkit-scrollbar { display: none; }
            `}</style>
            
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px',
                  background: activeCategory === cat ? colors.primary : colors.white,
                  color: activeCategory === cat ? colors.white : colors.text,
                  border: `1px solid ${activeCategory === cat ? colors.primary : '#e5e7eb'}`,
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SERVICES GALLERY */}
      <main style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {filteredServices.map(service => (
            <div 
              key={service.id}
              onClick={() => handleServiceClick(service)}
              style={{
                background: colors.white,
                borderRadius: '12px',
                overflow: 'hidden',
                border: `1px solid #f3f4f6`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Service Image */}
              <div style={{
                height: '180px',
                background: service.imageUrl 
                  ? `url(${service.imageUrl}) center/cover`
                  : colors.primary + '10',
                position: 'relative'
              }}>
                {!service.imageUrl && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: colors.primary,
                    opacity: 0.3
                  }}>
                    <Scissors size={40} />
                  </div>
                )}
                
                {/* Price Tag */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  background: colors.primary,
                  color: colors.white,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: '700'
                }}>
                  ${service.price}
                </div>
              </div>

              {/* Service Info */}
              <div style={{ padding: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: colors.dark,
                    margin: 0,
                    flex: 1
                  }}>
                    {service.name}
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: colors.text,
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    <Clock size={12} />
                    <span>{service.duration || 30}m</span>
                  </div>
                </div>
                
                {service.category && (
                  <div style={{
                    display: 'inline-block',
                    background: colors.primary + '10',
                    color: colors.primary,
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    marginBottom: '12px'
                  }}>
                    {service.category}
                  </div>
                )}
                
                {service.description && (
                  <p style={{
                    fontSize: '13px',
                    color: colors.text,
                    lineHeight: '1.4',
                    margin: '0 0 12px 0'
                  }}>
                    {service.description}
                  </p>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleServiceClick(service);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: colors.whatsapp,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageCircle size={14} />
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: colors.light,
            borderRadius: '12px',
            marginTop: '20px'
          }}>
            <Scissors size={32} color={colors.text} style={{ opacity: 0.4 }} />
            <p style={{
              color: colors.text,
              marginTop: '12px',
              fontSize: '14px'
            }}>
              No services available
            </p>
          </div>
        )}
      </main>

      {/* CONTACT DETAILS - Simple */}
      <section style={{
        padding: '32px 20px',
        background: colors.light,
        borderTop: `1px solid #f3f4f6`
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: colors.dark,
            margin: '0 0 24px 0',
            textAlign: 'center'
          }}>
            Contact Us
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {catalogueSettings?.address && (
              <div style={{
                textAlign: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  margin: '0 auto 12px',
                  background: colors.primary + '15',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin size={18} color={colors.primary} />
                </div>
                <p style={{
                  fontSize: '14px',
                  color: colors.dark,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  Location
                </p>
                <p style={{
                  fontSize: '13px',
                  color: colors.text,
                  margin: 0
                }}>
                  {catalogueSettings.address}
                </p>
              </div>
            )}
            
            {catalogueSettings?.contactPhone && (
              <div style={{
                textAlign: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  margin: '0 auto 12px',
                  background: colors.whatsapp + '15',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Phone size={18} color={colors.whatsapp} />
                </div>
                <p style={{
                  fontSize: '14px',
                  color: colors.dark,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  Phone
                </p>
                <a 
                  href={`tel:${catalogueSettings.contactPhone}`}
                  style={{
                    fontSize: '15px',
                    color: colors.whatsapp,
                    textDecoration: 'none',
                    fontWeight: '600',
                    display: 'block'
                  }}
                >
                  {catalogueSettings.contactPhone}
                </a>
              </div>
            )}
            
            {catalogueSettings?.showBusinessHours && (
              <div style={{
                textAlign: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  margin: '0 auto 12px',
                  background: colors.secondary + '15',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Clock size={18} color={colors.secondary} />
                </div>
                <p style={{
                  fontSize: '14px',
                  color: colors.dark,
                  fontWeight: '500',
                  margin: '0 0 4px 0'
                }}>
                  Hours
                </p>
                <p style={{
                  fontSize: '13px',
                  color: colors.text,
                  margin: 0
                }}>
                  {catalogueSettings.businessHours?.monday?.open || '9:00'} - {catalogueSettings.businessHours?.monday?.close || '18:00'}
                </p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleContactClick}
            style={{
              width: '100%',
              padding: '14px',
              background: colors.whatsapp,
              color: colors.white,
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <MessageCircle size={18} />
            Message on WhatsApp
          </button>
        </div>
      </section>

      {/* FLOATING WHATSAPP BUTTON */}
      <button
        onClick={handleContactClick}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          background: colors.whatsapp,
          color: colors.white,
          border: 'none',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}
      >
        <MessageCircle size={24} />
      </button>

      {/* SIMPLE FOOTER */}
      <footer style={{
        padding: '24px 20px',
        background: colors.dark,
        color: colors.white,
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '12px',
          opacity: 0.8,
          margin: '0 0 8px 0'
        }}>
          {salonData.name}
        </p>
        <p style={{
          fontSize: '11px',
          opacity: 0.6,
          margin: 0
        }}>
          © {new Date().getFullYear()} • Professional Beauty Services
        </p>
      </footer>
    </div>
  );
};

export default CataloguePage;