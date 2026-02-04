// CataloguePage.js - Clean Professional Layout
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { 
  MapPin, Phone, Clock, Scissors, MessageCircle, 
  Star, ChevronDown, Calendar, Banknote, AlertCircle
} from 'lucide-react';

const CataloguePage = () => {
  const { salonId } = useParams();
  const [salonData, setSalonData] = useState(null);
  const [services, setServices] = useState([]);
  const [catalogueSettings, setCatalogueSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showHours, setShowHours] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
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
    fetchCatalogueData();
  }, [salonId]);

 

  // Use salon's custom colors
  const colors = {
    primary: salonData?.primaryColor || '#8B5CF6',
    secondary: salonData?.secondaryColor || '#F59E0B',
    dark: '#111827',
    light: '#F9FAFB',
    text: '#4B5563',
    white: '#FFFFFF',
    whatsapp: '#25D366',
    success: '#10B981',
    warning: '#F59E0B'
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

  const handleBookClick = () => {
    openWhatsApp(`Hi ${salonData?.name || 'there'}! I'd like to book an appointment.`);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.white,
        padding: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid #f1f3f5`,
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
        background: colors.white,
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <Scissors size={40} color={colors.text} />
          <h2 style={{ 
            color: colors.dark, 
            marginTop: '16px', 
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Salon Not Found
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.white,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: colors.text,
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* HEADER SECTION */}
      <header style={{
        padding: '20px',
        background: colors.white,
        borderBottom: `1px solid #f1f3f5`
      }}>
        {/* Salon Identity */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Logo */}
          {catalogueSettings?.logoUrl ? (
            <img 
              src={catalogueSettings.logoUrl} 
              alt={salonData.name} 
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                objectFit: 'cover',
                flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: '60px',
              height: '60px',
              background: colors.primary,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.white,
              flexShrink: 0
            }}>
              <Scissors size={28} />
            </div>
          )}
          
          {/* Salon Name & Rating */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: colors.dark,
              margin: '0 0 8px 0',
              lineHeight: '1.2'
            }}>
              {salonData.name}
            </h1>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    color={colors.primary} 
                    fill={colors.primary}
                    style={{ flexShrink: 0 }}
                  />
                ))}
              </div>
              <span style={{
                fontSize: '14px',
                color: colors.dark,
                fontWeight: '600'
              }}>
                5.0
              </span>
              <span style={{
                fontSize: '14px',
                color: colors.text
              }}>
                (1 review)
              </span>
            </div>
          </div>
        </div>

        {/* Main Book Button */}
        <button
          onClick={handleBookClick}
          style={{
            width: '100%',
            padding: '16px',
            background: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}
        >
          <Calendar size={20} />
          Book Appointment
        </button>

        {/* Opening Hours */}
        <div style={{
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setShowHours(!showHours)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              padding: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Clock size={20} color={colors.primary} />
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: '14px',
                  color: colors.text,
                  marginBottom: '2px'
                }}>
                  Opening hours
                </div>
                <div style={{
                  fontSize: '15px',
                  color: colors.dark,
                  fontWeight: '500'
                }}>
                  Closed • Opens 8 AM Thu
                </div>
              </div>
            </div>
            <ChevronDown 
              size={20} 
              color={colors.text} 
              style={{ 
                transform: showHours ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            />
          </button>
          
          {showHours && catalogueSettings?.businessHours && (
            <div style={{
              padding: '16px',
              background: colors.light,
              borderRadius: '8px',
              marginTop: '8px'
            }}>
              {Object.entries(catalogueSettings.businessHours).map(([day, hours]) => (
                <div key={day} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  fontSize: '14px'
                }}>
                  <span style={{ 
                    textTransform: 'capitalize',
                    color: colors.text
                  }}>
                    {day}
                  </span>
                  <span style={{ 
                    fontWeight: '500',
                    color: hours.closed ? '#DC2626' : colors.dark
                  }}>
                    {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Address */}
        {catalogueSettings?.address && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px',
            borderTop: '1px solid #f1f3f5'
          }}>
            <MapPin size={20} color={colors.primary} />
            <div>
              <div style={{
                fontSize: '14px',
                color: colors.text,
                marginBottom: '4px'
              }}>
                Address
              </div>
              <div style={{
                fontSize: '15px',
                color: colors.dark,
                fontWeight: '500',
                lineHeight: '1.4'
              }}>
                {catalogueSettings.address}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* BOOKING POLICY */}
      <section style={{
        padding: '20px',
        background: colors.white,
        borderBottom: `1px solid #f1f3f5`
      }}>
        <button
          onClick={() => setShowPolicy(!showPolicy)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'transparent',
            border: 'none',
            padding: '0',
            cursor: 'pointer',
            marginBottom: showPolicy ? '16px' : '0'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={20} color={colors.warning} />
            <div style={{
              fontSize: '16px',
              color: colors.dark,
              fontWeight: '600'
            }}>
              Our Booking Policy
            </div>
          </div>
          <ChevronDown 
            size={20} 
            color={colors.text} 
            style={{ 
              transform: showPolicy ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          />
        </button>
        
        {showPolicy && (
          <div style={{
            padding: '16px',
            background: colors.light,
            borderRadius: '12px',
            marginTop: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              color: colors.dark,
              fontWeight: '500',
              marginBottom: '12px',
              lineHeight: '1.6'
            }}>
              Hello gorgeous!
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '16px',
              padding: '12px',
              background: colors.white,
              borderRadius: '8px',
              border: `1px solid ${colors.warning}30`
            }}>
              <AlertCircle size={18} color={colors.warning} />
              <div>
                <div style={{
                  fontSize: '14px',
                  color: colors.dark,
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  IMPORTANT
                </div>
                <div style={{
                  fontSize: '13px',
                  color: colors.text,
                  lineHeight: '1.5'
                }}>
                  Your appointment is only secured by a DEPOSIT PAYMENT of 50% (immediate payment) made 1 hr after booking.
                </div>
              </div>
            </div>
            
            <div style={{
              background: colors.white,
              borderRadius: '8px',
              padding: '16px',
              border: `1px solid #f1f3f5`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <Banknote size={18} color={colors.primary} />
                <div style={{
                  fontSize: '14px',
                  color: colors.dark,
                  fontWeight: '600'
                }}>
                  Banking Details
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ 
                    width: '100px', 
                    color: colors.text,
                    flexShrink: 0 
                  }}>
                    Bank:
                  </div>
                  <div style={{ color: colors.dark, fontWeight: '500' }}>
                    Nedbank
                  </div>
                </div>
                
                <div style={{ display: 'flex' }}>
                  <div style={{ 
                    width: '100px', 
                    color: colors.text,
                    flexShrink: 0 
                  }}>
                    Acc holder:
                  </div>
                  <div style={{ color: colors.dark, fontWeight: '500' }}>
                    KAT MOETI PTY LTD
                  </div>
                </div>
                
                <div style={{ display: 'flex' }}>
                  <div style={{ 
                    width: '100px', 
                    color: colors.text,
                    flexShrink: 0 
                  }}>
                    Acc number:
                  </div>
                  <div style={{ color: colors.dark, fontWeight: '500' }}>
                    1329805909
                  </div>
                </div>
                
                <div style={{ display: 'flex' }}>
                  <div style={{ 
                    width: '100px', 
                    color: colors.text,
                    flexShrink: 0 
                  }}>
                    Reference:
                  </div>
                  <div style={{ color: colors.dark, fontWeight: '500' }}>
                    Name + Date (eg. Katleho13)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SERVICES SECTION */}
      <section style={{
        padding: '20px',
        background: colors.white
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: colors.dark,
          margin: '0 0 20px 0'
        }}>
          Our Services
        </h2>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            marginBottom: '24px',
            paddingBottom: '8px'
          }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '10px 18px',
                  background: activeCategory === cat ? colors.primary : '#f8f9fa',
                  color: activeCategory === cat ? colors.white : colors.text,
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '14px',
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
        )}

        {/* Services Grid */}
        {filteredServices.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {filteredServices.map(service => (
              <div 
                key={service.id}
                style={{
                  background: colors.white,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `1px solid #f1f3f5`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                {/* Service Image */}
                <div style={{
                  height: '180px',
                  background: service.imageUrl 
                    ? `url(${service.imageUrl}) center/cover`
                    : `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)`,
                  position: 'relative'
                }}>
                  {!service.imageUrl && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: colors.primary,
                      opacity: 0.2
                    }}>
                      <Scissors size={48} />
                    </div>
                  )}
                  
                  {/* Price */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: colors.primary,
                    color: colors.white,
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}>
                    ${service.price}
                  </div>
                  
                  {/* Duration */}
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    background: 'rgba(255,255,255,0.95)',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: colors.text
                  }}>
                    <Clock size={12} />
                    {service.duration || 30} min
                  </div>
                </div>

                {/* Service Info */}
                <div style={{ padding: '16px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: colors.dark,
                        margin: '0 0 8px 0',
                        lineHeight: '1.3'
                      }}>
                        {service.name}
                      </h3>
                      
                      {service.category && (
                        <div style={{
                          display: 'inline-block',
                          background: colors.primary + '15',
                          color: colors.primary,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {service.category}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {service.description && (
                    <p style={{
                      fontSize: '14px',
                      color: colors.text,
                      lineHeight: '1.4',
                      margin: '0 0 20px 0'
                    }}>
                      {service.description}
                    </p>
                  )}
                  
                  <button
                    onClick={() => handleServiceClick(service)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: colors.whatsapp,
                      color: colors.white,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <MessageCircle size={16} />
                    Book This Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: colors.light,
            borderRadius: '12px'
          }}>
            <Scissors size={40} color={colors.primary} style={{ opacity: 0.5 }} />
            <p style={{
              color: colors.text,
              marginTop: '12px',
              fontSize: '14px'
            }}>
              No services available
            </p>
          </div>
        )}
      </section>

      {/* CONTACT SECTION */}
      <section style={{
        padding: '20px',
        background: colors.light,
        borderTop: `1px solid #f1f3f5`
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: colors.dark,
          margin: '0 0 20px 0',
          textAlign: 'center'
        }}>
          Contact Us
        </h2>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          {catalogueSettings?.contactPhone && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <a 
                href={`tel:${catalogueSettings.contactPhone}`}
                style={{
                  fontSize: '16px',
                  color: colors.primary,
                  textDecoration: 'none',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Phone size={18} />
                {catalogueSettings.contactPhone}
              </a>
            </div>
          )}
          
          <button
            onClick={handleBookClick}
            style={{
              padding: '16px',
              background: colors.whatsapp,
              color: colors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <MessageCircle size={20} />
            WhatsApp Us
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '24px 20px',
        background: colors.dark,
        color: colors.white,
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '12px',
          opacity: 0.8,
          margin: '0 0 8px 0'
        }}>
          {salonData.name}
        </div>
        <div style={{
          fontSize: '11px',
          opacity: 0.6,
          margin: 0
        }}>
          © {new Date().getFullYear()} • Professional Beauty Services
        </div>
      </footer>

      {/* FLOATING WHATSAPP BUTTON */}
      <button
        onClick={handleBookClick}
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
          boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
          zIndex: 1000
        }}
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
};

export default CataloguePage;