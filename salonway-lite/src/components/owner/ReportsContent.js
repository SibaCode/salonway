// src/components/owner/ReportsContent.js
import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportsContent = ({ salonId, salonData, ownerData }) => {
  const [reportsData, setReportsData] = useState({
    todayRevenue: 0,
    todayServices: 0,
    todayClients: 0,
    todayForms: 0,
    activeStaff: 0,
    totalStaff: 0
  });
  
  const [topStaff, setTopStaff] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Helper function to get time ago
  const getTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Just now';
    }
  }, []);

  // Get date range for query
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    switch(dateRange) {
      case 'today':
        return { start: today, end: now };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return { start: yesterday, end: new Date(yesterday.setHours(23, 59, 59, 999)) };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: now };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return { start: monthStart, end: now };
      default:
        return { start: today, end: now };
    }
  };

  // Get date label for display
  const getDateLabel = () => {
    const { start, end } = getDateRange();
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (dateRange === 'today') return `Today (${startStr})`;
    if (dateRange === 'yesterday') return `Yesterday (${startStr})`;
    if (dateRange === 'week') return `This Week (${startStr} - ${endStr})`;
    if (dateRange === 'month') return `This Month (${startStr} - ${endStr})`;
    return startStr;
  };

  const fetchReportsData = useCallback(async () => {
    try {
      console.log("Fetching reports data for salon:", salonId);
      
      const { start, end } = getDateRange();
      
      // 1. Get ALL work logs
      const workSnapshot = await getDocs(collection(db, 'workLogs'));
      const allWorkLogs = workSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for this salon
      const salonWorkLogs = allWorkLogs.filter(log => log.salonId === salonId);
      
      // Filter by date range
      const filteredWorkLogs = salonWorkLogs.filter(log => {
        if (!log.timestamp) return false;
        try {
          const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
          return logDate >= start && logDate <= end;
        } catch {
          return false;
        }
      });
      
      setWorkLogs(filteredWorkLogs);
      
      // 2. Get ALL consultations
      const formSnapshot = await getDocs(collection(db, 'consultations'));
      const allForms = formSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for this salon
      const salonForms = allForms.filter(form => form.salonId === salonId);
      
      // Filter by date range
      const filteredForms = salonForms.filter(form => {
        if (!form.createdAt) return false;
        try {
          const formDate = form.createdAt.toDate ? form.createdAt.toDate() : new Date(form.createdAt);
          return formDate >= start && formDate <= end;
        } catch {
          return false;
        }
      });
      
      setConsultations(filteredForms);
      
      // 3. Get ALL clock records for active staff
      const clockSnapshot = await getDocs(collection(db, 'clockRecords'));
      const allClockRecords = clockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for this salon AND active staff (no clockOut)
      const activeStaffList = allClockRecords.filter(record => 
        record.salonId === salonId && !record.clockOut
      );
      
      // 4. Get total staff count
      const staffSnapshot = await getDocs(collection(db, 'salons', salonId, 'staff'));
      const totalStaff = staffSnapshot.docs.length;
      
      // Calculate today's revenue
      const todayRevenue = filteredWorkLogs.reduce((total, log) => {
        return total + (parseFloat(log.servicePrice) || 0);
      }, 0);
      
      // Count unique clients
      const clientSet = new Set();
      filteredWorkLogs.forEach(log => {
        if (log.client && log.client !== 'Walk-in') {
          clientSet.add(log.client);
        }
      });
      
      // Calculate top staff performance
      const staffMap = {};
      filteredWorkLogs.forEach(log => {
        const staffName = log.staffName || 'Unknown Staff';
        const price = parseFloat(log.servicePrice) || 0;
        
        if (!staffMap[staffName]) {
          staffMap[staffName] = {
            name: staffName,
            revenue: 0,
            services: 0,
            clients: new Set()
          };
        }
        staffMap[staffName].revenue += price;
        staffMap[staffName].services += 1;
        if (log.client) staffMap[staffName].clients.add(log.client);
      });
      
      const staffPerformance = Object.values(staffMap)
        .map(staff => ({
          ...staff,
          clientCount: staff.clients.size,
          avgRevenue: staff.services > 0 ? staff.revenue / staff.services : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      setTopStaff(staffPerformance);
      
      // Calculate popular services
      const serviceMap = {};
      filteredWorkLogs.forEach(log => {
        const serviceName = log.serviceName || 'Unknown Service';
        const price = parseFloat(log.servicePrice) || 0;
        
        if (!serviceMap[serviceName]) {
          serviceMap[serviceName] = {
            name: serviceName,
            count: 0,
            revenue: 0,
            avgPrice: 0
          };
        }
        serviceMap[serviceName].count += 1;
        serviceMap[serviceName].revenue += price;
      });
      
      // Calculate average prices
      Object.keys(serviceMap).forEach(key => {
        const service = serviceMap[key];
        service.avgPrice = service.count > 0 ? service.revenue / service.count : 0;
      });
      
      const popularServicesList = Object.values(serviceMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      setPopularServices(popularServicesList);
      
      // Prepare recent activity
      const activities = [];
      
      // Add work log activities
      filteredWorkLogs.slice(0, 10).forEach(log => {
        activities.push({
          id: log.id,
          type: 'service',
          message: `${log.staffName || 'Staff'} performed ${log.serviceName || 'service'} for ${log.client || 'Walk-in'}`,
          time: getTimeAgo(log.timestamp),
          price: parseFloat(log.servicePrice) || 0
        });
      });
      
      // Add form activities
      filteredForms.slice(0, 5).forEach(form => {
        activities.push({
          id: form.id,
          type: 'form',
          message: `New consultation from ${form.clientName || 'Client'}`,
          time: getTimeAgo(form.createdAt),
          price: 0
        });
      });
      
      setRecentActivity(activities);
      
      // Update all state
      setReportsData({
        todayRevenue: todayRevenue,
        todayServices: filteredWorkLogs.length,
        todayClients: clientSet.size,
        todayForms: filteredForms.length,
        activeStaff: activeStaffList.length,
        totalStaff: totalStaff
      });
      
    } catch (error) {
      console.error('Error in fetchReportsData:', error);
    } finally {
      setLoading(false);
    }
  }, [salonId, dateRange, getTimeAgo]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // Refresh button function
  const refreshReports = () => {
    setLoading(true);
    fetchReportsData();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `R${parseFloat(amount).toFixed(2)}`;
  };

  // Format date for PDF
  const formatDateForPDF = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate and download PDF report
  const generatePDFReport = () => {
    setGeneratingPDF(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text(`${salonData.name} - Performance Report`, pageWidth / 2, 20, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Report Period: ${getDateLabel()}`, pageWidth / 2, 30, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 36, { align: 'center' });
      
      let yPosition = 50;
      
      // Summary Stats
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Summary Statistics', 20, yPosition);
      yPosition += 10;
      
      doc.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: [
          ['Total Revenue', formatCurrency(reportsData.todayRevenue)],
          ['Services Completed', reportsData.todayServices.toString()],
          ['Clients Served', reportsData.todayClients.toString()],
          ['Form Submissions', reportsData.todayForms.toString()],
          ['Active Staff', `${reportsData.activeStaff}/${reportsData.totalStaff}`],
          ['Average per Service', formatCurrency(reportsData.todayServices > 0 ? reportsData.todayRevenue / reportsData.todayServices : 0)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 }
      });
      
      yPosition = doc.lastAutoTable.finalY + 20;
      
      // Top Staff Performance
      if (topStaff.length > 0) {
        doc.setFontSize(16);
        doc.text('Top Performing Staff', 20, yPosition);
        yPosition += 10;
        
        const staffTableData = topStaff.map((staff, index) => [
          (index + 1).toString(),
          staff.name,
          formatCurrency(staff.revenue),
          staff.services.toString(),
          staff.clientCount.toString(),
          formatCurrency(staff.avgRevenue)
        ]);
        
        doc.autoTable({
          startY: yPosition,
          head: [['Rank', 'Staff Name', 'Revenue', 'Services', 'Clients', 'Avg/Service']],
          body: staffTableData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 20, right: 20 }
        });
        
        yPosition = doc.lastAutoTable.finalY + 20;
      }
      
      // Popular Services
      if (popularServices.length > 0) {
        doc.setFontSize(16);
        doc.text('Most Popular Services', 20, yPosition);
        yPosition += 10;
        
        const servicesTableData = popularServices.map((service, index) => [
          (index + 1).toString(),
          service.name,
          service.count.toString(),
          formatCurrency(service.revenue),
          formatCurrency(service.avgPrice)
        ]);
        
        doc.autoTable({
          startY: yPosition,
          head: [['Rank', 'Service Name', 'Bookings', 'Revenue', 'Average Price']],
          body: servicesTableData,
          theme: 'grid',
          headStyles: { fillColor: [245, 158, 11] },
          margin: { left: 20, right: 20 }
        });
        
        yPosition = doc.lastAutoTable.finalY + 20;
      }
      
      // Work Logs (Detailed)
      if (workLogs.length > 0) {
        doc.setFontSize(16);
        doc.text('Detailed Work Logs', 20, yPosition);
        yPosition += 10;
        
        const workLogsData = workLogs.slice(0, 50).map(log => [
          log.timestamp?.toDate?.()?.toLocaleDateString() || 'N/A',
          log.staffName || 'Unknown',
          log.serviceName || 'Service',
          log.client || 'Walk-in',
          formatCurrency(log.servicePrice || 0)
        ]);
        
        doc.autoTable({
          startY: yPosition,
          head: [['Date', 'Staff', 'Service', 'Client', 'Amount']],
          body: workLogsData,
          theme: 'grid',
          headStyles: { fillColor: [139, 92, 246] },
          margin: { left: 20, right: 20 }
        });
        
        yPosition = doc.lastAutoTable.finalY + 20;
      }
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by SalonWay Business Management System', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      doc.text(`Salon: ${salonData.name} | Owner: ${ownerData.name}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
      
      // Save PDF
      const fileName = `${salonData.name.replace(/\s+/g, '_')}_Report_${dateRange}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Generate CSV report
  const generateCSVReport = () => {
    try {
      // Work logs CSV
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Header
      const headers = [
        'Date,Staff,Service,Client,Amount,Category\n'
      ].join('');
      
      csvContent += headers;
      
      // Data rows
      workLogs.forEach(log => {
        const row = [
          log.timestamp?.toDate?.()?.toLocaleDateString() || 'N/A',
          log.staffName || 'Unknown',
          `"${log.serviceName || 'Service'}"`,
          log.client || 'Walk-in',
          formatCurrency(log.servicePrice || 0),
          log.serviceCategory || 'General'
        ].join(',') + '\n';
        
        csvContent += row;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${salonData.name}_WorkLogs_${dateRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to generate CSV report. Please try again.');
    }
  };

  // Date range options
  const dateOptions = [
    { id: 'today', label: 'Today', color: '#3B82F6' },
    { id: 'yesterday', label: 'Yesterday', color: '#8B5CF6' },
    { id: 'week', label: 'This Week', color: '#10B981' },
    { id: 'month', label: 'This Month', color: '#F59E0B' }
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '400px',
        padding: '40px'
      }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <p style={{ color: '#6B7280', fontSize: '16px' }}>Loading reports data...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header with Export Options */}
      <div style={{ 
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: '0 0 8px 0' }}>
              📊 Reports & Analytics
            </h1>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
              {getDateLabel()} • Generate detailed reports
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={refreshReports}
              style={{
                padding: '10px 16px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔄 Refresh
            </button>
            
            <button 
              onClick={generateCSVReport}
              disabled={workLogs.length === 0}
              style={{
                padding: '10px 16px',
                background: workLogs.length === 0 ? '#e5e7eb' : '#10b981',
                color: workLogs.length === 0 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: workLogs.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📁 Export CSV
            </button>
            
            <button 
              onClick={generatePDFReport}
              disabled={generatingPDF}
              style={{
                padding: '10px 16px',
                background: generatingPDF ? '#e5e7eb' : '#3b82f6',
                color: generatingPDF ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: generatingPDF ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {generatingPDF ? '⏳ Generating...' : '📄 Generate PDF Report'}
            </button>
          </div>
        </div>
        
        {/* Date Range Selector */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px' }}>
          {dateOptions.map(option => {
            const dateButtonStyle = {
              padding: '10px 16px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              flexShrink: 0,
              background: dateRange === option.id ? option.color : '#F3F4F6',
              color: dateRange === option.id ? 'white' : '#6B7280'
            };
            
            return (
              <button
                key={option.id}
                style={dateButtonStyle}
                onClick={() => setDateRange(option.id)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* {[
          {
            title: 'Total Revenue',
            value: formatCurrency(reportsData.todayRevenue),
            icon: '💰',
            color: '#10B981',
            description: 'Total income from services'
          },
          {
            title: 'Services Completed',
            value: reportsData.todayServices,
            icon: '💼',
            color: '#3B82F6',
            description: 'Services rendered'
          },
          {
            title: 'Clients Served',
            value: reportsData.todayClients,
            icon: '👥',
            color: '#8B5CF6',
            description: 'Unique clients'
          },
          {
            title: 'Forms Submitted',
            value: reportsData.todayForms,
            icon: '📝',
            color: '#F59E0B',
            description: 'Consultation forms'
          },
          {
            title: 'Staff Activity',
            value: `${reportsData.activeStaff}/${reportsData.totalStaff}`,
            icon: '👤',
            color: '#EC4899',
            description: 'Active/Total staff'
          },
          {
            title: 'Avg per Service',
            value: reportsData.todayServices > 0 ? 
              formatCurrency(reportsData.todayRevenue / reportsData.todayServices) : 'R0',
            icon: '📊',
            color: '#6366F1',
            description: 'Average revenue per service'
          }
        ].map((stat, index) => (
          <div 
            key={index}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'white',
                background: stat.color
              }}>
                {stat.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                  {stat.title}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '4px' }}>
                  {stat.value}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
              {stat.description}
            </div>
          </div>
        ))} */}
      </div>

      {/* Two Column Layout */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Top Staff */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
              👑 Top Performing Staff
            </h3>
            <span style={{ 
              background: '#F3F4F6',
              color: '#4B5563',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {topStaff.length}
            </span>
          </div>
          
          {topStaff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', color: '#D1D5DB', marginBottom: '16px' }}>👥</div>
              <p style={{ color: '#6B7280', fontSize: '14px' }}>
                No staff activity for this period
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topStaff.map((staff, index) => (
                <div 
                  key={staff.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: index === 0 ? '#F59E0B' : index === 1 ? '#6B7280' : index === 2 ? '#8B5CF6' : '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'white',
                    marginRight: '12px'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                      {staff.name}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6B7280' }}>
                      <span>{formatCurrency(staff.revenue)}</span>
                      <span>•</span>
                      <span>{staff.services} services</span>
                      <span>•</span>
                      <span>{staff.clientCount} clients</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Services */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
              ⭐ Popular Services
            </h3>
            <span style={{ 
              background: '#F3F4F6',
              color: '#4B5563',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {popularServices.length}
            </span>
          </div>
          
          {popularServices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', color: '#D1D5DB', marginBottom: '16px' }}>💇</div>
              <p style={{ color: '#6B7280', fontSize: '14px' }}>
                No services booked for this period
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {popularServices.map((service, index) => (
                <div 
                  key={service.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    borderRadius: '12px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: index === 0 ? '#10B981' : index === 1 ? '#3B82F6' : index === 2 ? '#8B5CF6' : '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'white',
                    marginRight: '12px'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                      {service.name}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6B7280' }}>
                      <span>{service.count} bookings</span>
                      <span>•</span>
                      <span>{formatCurrency(service.revenue)}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#10B981' }}>
                    {formatCurrency(service.avgPrice)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
            📡 Recent Activity
          </h3>
          <span style={{ 
            background: '#F3F4F6',
            color: '#4B5563',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {recentActivity.length}
          </span>
        </div>
        
        {recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', color: '#D1D5DB', marginBottom: '16px' }}>📝</div>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              No activity for this period
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentActivity.map((item) => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{ 
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                  color: 'white',
                  background: item.type === 'service' ? '#10B981' : '#F59E0B',
                  marginRight: '12px'
                }}>
                  {item.type === 'service' ? '💼' : '📝'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#1F2937'
                  }}>
                    {item.message}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6B7280' }}>
                    <span>{item.time}</span>
                    {item.price > 0 && (
                      <>
                        <span>•</span>
                        <span style={{ fontWeight: '600', color: '#10B981' }}>
                          {formatCurrency(item.price)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #E5E7EB'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: '0 0 20px 0' }}>
          📊 Data Summary
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#3B82F6', marginBottom: '8px' }}>
              {workLogs.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              Total Work Logs
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10B981', marginBottom: '8px' }}>
              {consultations.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              Consultation Forms
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#8B5CF6', marginBottom: '8px' }}>
              {reportsData.todayServices > 0 ? formatCurrency(reportsData.todayRevenue / reportsData.todayServices) : 'R0'}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              Average per Service
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#F59E0B', marginBottom: '8px' }}>
              {reportsData.todayClients > 0 ? (reportsData.todayServices / reportsData.todayClients).toFixed(1) : '0'}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              Services per Client
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .reports-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .reports-actions {
            flex-direction: column;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsContent;