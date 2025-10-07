import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import { cookies } from 'next/headers';

// Export formats
type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

interface BookingExportData {
  id: string;
  bookingNumber: string;
  bookingReference: string;
  
  // Customer Information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAge: number;
  customerGender: string;
  customerDateOfBirth: string;
  
  // Trek Information
  trekName: string;
  trekSlug: string;
  trekRegion: string;
  trekDifficulty: string;
  trekDuration: string;
  trekDate: string;
  trekStartLocation: string;
  trekEndLocation: string;
  
  // Booking Details
  participants: number;
  participantNames: string;
  totalAmount: number;
  baseAmount: number;
  gstAmount: number;
  amountPerPerson: number;
  status: string;
  paymentStatus: string;
  bookingDate: string;
  bookingTime: string;
  
  // Health & Safety Information
  medicalConditions: string;
  currentMedications: string;
  recentIllnesses: string;
  trekkingExperience: string;
  fitnessLevel: string;
  dietaryRestrictions: string;
  allergies: string;
  
  // Emergency Contacts
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  
  // Logistics Information
  residentialAddress: string;
  pickupLocation: string;
  needsTransportation: string;
  accommodationPreferences: string;
  specialRequirements: string;
  gearRental: string;
  porterServices: string;
  
  // Slot Information
  slotDate: string;
  slotCapacity: number;
  slotBooked: number;
  slotAvailable: number;
  slotUtilization: string;
  
  // Guide Information
  guideNotes: string;
  riskAssessment: string;
  equipmentNeeded: string;
  
  // Administrative
  createdBy: string;
  lastModified: string;
  approvedBy: string;
  approvalDate: string;
  
  // Additional Metadata
  seasonType: string;
  weatherConditions: string;
  groupSize: string;
  experienceLevel: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = await canUserAccessAdmin(sessionId);
    if (!authResult.canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const format = (url.searchParams.get('format') || 'csv') as ExportFormat;
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const trekSlug = url.searchParams.get('trekSlug');
    const userFilter = url.searchParams.get('userFilter');
    const specificUser = url.searchParams.get('specificUser');

    // Fetch bookings with filters
    let query = supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (trekSlug) {
      query = query.eq('trek_slug', trekSlug);
    }
    if (specificUser) {
      // Filter by specific user email or ID
      query = query.or(`customer_email.eq.${specificUser},user_id.eq.${specificUser}`);
    }

    const { data: bookings, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ error: 'No bookings found' }, { status: 404 });
    }

    // Fetch related data
    const trekSlugs = [...new Set(bookings.map(b => b.trek_slug).filter(Boolean))];
    const slotIds = [...new Set(bookings.map(b => b.slot_id).filter(Boolean))];
    const userIds = [...new Set(bookings.map(b => b.user_id).filter(Boolean))];

    const [treksResult, slotsResult, profilesResult, participantsResult] = await Promise.all([
      supabaseAdmin.from('treks').select('*').in('slug', trekSlugs),
      supabaseAdmin.from('trek_slots').select('*').in('id', slotIds),
      supabaseAdmin.from('user_profiles').select('*').in('user_id', userIds),
      supabaseAdmin.from('booking_participants').select('*').in('booking_id', bookings.map(b => b.id))
    ]);

    // Create lookup maps
    const treksMap = new Map((treksResult.data || []).map(t => [t.slug, t]));
    const slotsMap = new Map((slotsResult.data || []).map(s => [s.id, s]));
    const profilesMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));
    const participantsMap = new Map();
    
    // Group participants by booking_id
    (participantsResult.data || []).forEach(participant => {
      if (!participantsMap.has(participant.booking_id)) {
        participantsMap.set(participant.booking_id, []);
      }
      participantsMap.get(participant.booking_id).push(participant);
    });

    // Helper functions for data transformation
    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('en-IN');
      } catch {
        return dateStr || 'N/A';
      }
    };

    const formatDateTime = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleString('en-IN');
      } catch {
        return dateStr || 'N/A';
      }
    };

    const getSeasonType = (date: string) => {
      try {
        const month = new Date(date).getMonth() + 1;
        if (month >= 3 && month <= 5) return 'Spring';
        if (month >= 6 && month <= 8) return 'Monsoon';
        if (month >= 9 && month <= 11) return 'Post-Monsoon';
        return 'Winter';
      } catch {
        return 'Unknown';
      }
    };

    const getExperienceLevel = (experience: string) => {
      if (!experience) return 'Not Specified';
      const exp = experience.toLowerCase();
      if (exp.includes('beginner') || exp.includes('first')) return 'Beginner';
      if (exp.includes('intermediate') || exp.includes('some')) return 'Intermediate';
      if (exp.includes('advanced') || exp.includes('expert')) return 'Advanced';
      return experience;
    };

    const getRiskAssessment = (medicalConditions: string, experience: string, age: number) => {
      let risk = 'Low';
      if (medicalConditions && medicalConditions.toLowerCase() !== 'none' && medicalConditions.trim() !== '') {
        risk = 'Medium';
      }
      if (age && (age < 18 || age > 60)) {
        risk = risk === 'Medium' ? 'High' : 'Medium';
      }
      if (experience && experience.toLowerCase().includes('beginner')) {
        risk = risk === 'High' ? 'High' : 'Medium';
      }
      return risk;
    };

    // Transform data for export
    let exportData: BookingExportData[] = bookings.map((booking, index) => {
      const trek = treksMap.get(booking.trek_slug);
      const slot = slotsMap.get(booking.slot_id);
      const profile = profilesMap.get(booking.user_id);
      const participants = participantsMap.get(booking.id) || [];
      const participantNames = participants.map(p => p.full_name).join(', ') || booking.customer_name || 'N/A';
      
      const customerAge = booking.customer_age || (booking.customer_dob ? 
        Math.floor((Date.now() - new Date(booking.customer_dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0);
      
      const baseAmount = booking.base_amount || 0;
      const totalAmount = booking.total_amount || 0;
      const amountPerPerson = booking.participants ? Math.round(totalAmount / booking.participants) : totalAmount;
      
      const available = Math.max(0, (slot?.capacity || 0) - (slot?.booked || 0));
      const utilization = slot?.capacity ? `${Math.round(((slot.booked || 0) / slot.capacity) * 100)}%` : 'N/A';
      
      return {
        id: booking.id,
        bookingNumber: `NMD-${String(index + 1).padStart(4, '0')}`,
        bookingReference: `${booking.trek_slug?.toUpperCase().slice(0, 3) || 'TRK'}-${booking.id.slice(0, 8)}`,
        
        // Customer Information
        customerName: profile?.name || booking.customer_name || 'N/A',
        customerEmail: booking.customer_email || 'N/A',
        customerPhone: booking.customer_phone || 'N/A',
        customerAge: customerAge,
        customerGender: booking.customer_gender?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not Specified',
        customerDateOfBirth: booking.customer_dob ? formatDate(booking.customer_dob) : 'N/A',
        
        // Trek Information
        trekName: trek?.name || booking.trek_slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A',
        trekSlug: booking.trek_slug || 'N/A',
        trekRegion: trek?.region || 'N/A',
        trekDifficulty: trek?.difficulty || 'N/A',
        trekDuration: trek?.duration || 'N/A',
        trekDate: slot?.date ? formatDate(slot.date) : (booking.booking_date ? formatDate(booking.booking_date) : 'N/A'),
        trekStartLocation: 'To be confirmed by guide', // This would come from trek data
        trekEndLocation: 'To be confirmed by guide', // This would come from trek data
        
        // Booking Details
        participants: booking.participants || 1,
        participantNames: participantNames,
        totalAmount: totalAmount,
        baseAmount: baseAmount,
        gstAmount: booking.gst_amount || 0,
        amountPerPerson: amountPerPerson,
        status: booking.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A',
        paymentStatus: booking.payment_status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A',
        bookingDate: formatDate(booking.created_at),
        bookingTime: formatDateTime(booking.created_at),
        
        // Health & Safety Information
        medicalConditions: booking.medical_conditions || 'None reported',
        currentMedications: booking.current_medications || 'None reported',
        recentIllnesses: booking.recent_illnesses || 'None reported',
        trekkingExperience: getExperienceLevel(booking.trekking_experience),
        fitnessLevel: booking.fitness_consent ? 'Fitness declared' : 'Fitness not confirmed',
        dietaryRestrictions: 'To be collected', // This would need to be added to schema
        allergies: 'To be collected', // This would need to be added to schema
        
        // Emergency Contacts
        emergencyContactName: booking.emergency_contact_name || 'N/A',
        emergencyContactPhone: booking.emergency_contact_phone || 'N/A',
        emergencyContactRelation: 'To be collected', // This would need to be added to schema
        
        // Logistics Information
        residentialAddress: booking.residential_address || 'N/A',
        pickupLocation: booking.pickup_point || 'Standard pickup point',
        needsTransportation: booking.needs_transportation ? 'Yes' : 'No',
        accommodationPreferences: 'Standard accommodation', // This could be enhanced
        specialRequirements: booking.special_requirements || 'None',
        gearRental: booking.trek_gear_rental ? 'Yes' : 'No',
        porterServices: booking.porter_services ? 'Yes' : 'No',
        
        // Slot Information
        slotDate: slot?.date ? formatDate(slot.date) : 'N/A',
        slotCapacity: slot?.capacity || 0,
        slotBooked: slot?.booked || 0,
        slotAvailable: available,
        slotUtilization: utilization,
        
        // Guide Information
        guideNotes: `Group size: ${booking.participants}, Experience: ${getExperienceLevel(booking.trekking_experience)}, Medical: ${booking.medical_conditions ? 'Yes' : 'None'}`,
        riskAssessment: getRiskAssessment(booking.medical_conditions, booking.trekking_experience, customerAge),
        equipmentNeeded: `${booking.trek_gear_rental ? 'Gear rental required, ' : ''}${booking.porter_services ? 'Porter services required' : 'Standard equipment'}`,
        
        // Administrative
        createdBy: 'System', // This would need admin user tracking
        lastModified: formatDateTime(booking.updated_at || booking.created_at),
        approvedBy: booking.status === 'confirmed' ? 'Admin' : 'Pending',
        approvalDate: booking.status === 'confirmed' ? formatDate(booking.updated_at || booking.created_at) : 'N/A',
        
        // Additional Metadata
        seasonType: getSeasonType(slot?.date || booking.booking_date || booking.created_at),
        weatherConditions: 'Check weather forecast before trek',
        groupSize: booking.participants === 1 ? 'Solo' : booking.participants <= 4 ? 'Small Group' : 'Large Group',
        experienceLevel: getExperienceLevel(booking.trekking_experience)
      };
    });

    // Apply user-specific filters
    if (userFilter && userFilter !== 'all') {
      switch (userFilter) {
        case 'high_risk':
          exportData = exportData.filter(booking => booking.riskAssessment === 'High');
          break;
        case 'medical_concerns':
          exportData = exportData.filter(booking => 
            booking.medicalConditions !== 'None reported' || 
            booking.currentMedications !== 'None reported' ||
            booking.recentIllnesses !== 'None reported'
          );
          break;
        case 'first_time':
          exportData = exportData.filter(booking => 
            booking.experienceLevel === 'Beginner' || 
            booking.experienceLevel === 'Not Specified'
          );
          break;
        case 'experienced':
          exportData = exportData.filter(booking => 
            booking.experienceLevel === 'Advanced' || 
            booking.experienceLevel === 'Intermediate'
          );
          break;
      }
    }

    // Generate export based on format
    switch (format) {
      case 'csv':
        return generateCSVExport(exportData);
      case 'json':
        return generateJSONExport(exportData);
      case 'excel':
        return generateExcelExport(exportData);
      case 'pdf':
        return generatePDFExport(exportData);
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function generateCSVExport(data: BookingExportData[]) {
  const headers = [
    // Basic Information
    'Booking Number',
    'Booking Reference',
    'Booking Date',
    'Booking Time',
    'Status',
    'Payment Status',
    
    // Customer Information
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Customer Age',
    'Customer Gender',
    'Date of Birth',
    'Residential Address',
    
    // Trek Information
    'Trek Name',
    'Trek Slug',
    'Trek Region',
    'Trek Difficulty',
    'Trek Duration',
    'Trek Date',
    'Trek Start Location',
    'Trek End Location',
    'Season Type',
    
    // Booking Details
    'Participants',
    'Participant Names',
    'Group Size Category',
    'Total Amount (₹)',
    'Base Amount (₹)',
    'GST Amount (₹)',
    'Amount Per Person (₹)',
    
    // Health & Safety
    'Medical Conditions',
    'Current Medications',
    'Recent Illnesses',
    'Trekking Experience',
    'Experience Level',
    'Fitness Level',
    'Risk Assessment',
    'Dietary Restrictions',
    'Allergies',
    
    // Emergency Contacts
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Emergency Contact Relation',
    
    // Logistics
    'Pickup Location',
    'Needs Transportation',
    'Accommodation Preferences',
    'Special Requirements',
    'Gear Rental Required',
    'Porter Services Required',
    'Equipment Needed',
    
    // Slot Information
    'Slot Date',
    'Slot Capacity',
    'Slot Booked',
    'Slot Available',
    'Slot Utilization',
    
    // Guide Information
    'Guide Notes',
    'Weather Conditions',
    
    // Administrative
    'Created By',
    'Last Modified',
    'Approved By',
    'Approval Date'
  ];

  const csvRows = [
    headers.join(','),
    ...data.map(row => [
      // Basic Information
      row.bookingNumber,
      `"${row.bookingReference}"`,
      row.bookingDate,
      `"${row.bookingTime}"`,
      row.status,
      row.paymentStatus,
      
      // Customer Information
      `"${row.customerName}"`,
      row.customerEmail,
      row.customerPhone,
      row.customerAge,
      row.customerGender,
      row.customerDateOfBirth,
      `"${row.residentialAddress}"`,
      
      // Trek Information
      `"${row.trekName}"`,
      row.trekSlug,
      row.trekRegion,
      row.trekDifficulty,
      row.trekDuration,
      row.trekDate,
      `"${row.trekStartLocation}"`,
      `"${row.trekEndLocation}"`,
      row.seasonType,
      
      // Booking Details
      row.participants,
      `"${row.participantNames}"`,
      row.groupSize,
      row.totalAmount,
      row.baseAmount,
      row.gstAmount,
      row.amountPerPerson,
      
      // Health & Safety
      `"${row.medicalConditions}"`,
      `"${row.currentMedications}"`,
      `"${row.recentIllnesses}"`,
      row.trekkingExperience,
      row.experienceLevel,
      row.fitnessLevel,
      row.riskAssessment,
      `"${row.dietaryRestrictions}"`,
      `"${row.allergies}"`,
      
      // Emergency Contacts
      `"${row.emergencyContactName}"`,
      row.emergencyContactPhone,
      `"${row.emergencyContactRelation}"`,
      
      // Logistics
      `"${row.pickupLocation}"`,
      row.needsTransportation,
      `"${row.accommodationPreferences}"`,
      `"${row.specialRequirements}"`,
      row.gearRental,
      row.porterServices,
      `"${row.equipmentNeeded}"`,
      
      // Slot Information
      row.slotDate,
      row.slotCapacity,
      row.slotBooked,
      row.slotAvailable,
      row.slotUtilization,
      
      // Guide Information
      `"${row.guideNotes}"`,
      `"${row.weatherConditions}"`,
      
      // Administrative
      row.createdBy,
      `"${row.lastModified}"`,
      row.approvedBy,
      row.approvalDate
    ].join(','))
  ];

  const csvContent = csvRows.join('\n');
  const timestamp = new Date().toISOString().split('T')[0];

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="nomadic-travels-detailed-bookings-${timestamp}.csv"`
    }
  });
}

function generateJSONExport(data: BookingExportData[]) {
  const exportObject = {
    exportInfo: {
      generatedAt: new Date().toISOString(),
      totalBookings: data.length,
      exportedBy: 'Trek Hub India Admin',
      format: 'JSON',
      version: '2.0 - Enhanced for Guides'
    },
    summary: {
      totalBookings: data.length,
      totalRevenue: data.reduce((sum, booking) => sum + booking.totalAmount, 0),
      totalParticipants: data.reduce((sum, booking) => sum + booking.participants, 0),
      averageGroupSize: Math.round(data.reduce((sum, booking) => sum + booking.participants, 0) / data.length * 10) / 10,
      statusBreakdown: data.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      regionBreakdown: data.reduce((acc, booking) => {
        acc[booking.trekRegion] = (acc[booking.trekRegion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      experienceBreakdown: data.reduce((acc, booking) => {
        acc[booking.experienceLevel] = (acc[booking.experienceLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      riskAssessmentBreakdown: data.reduce((acc, booking) => {
        acc[booking.riskAssessment] = (acc[booking.riskAssessment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      seasonBreakdown: data.reduce((acc, booking) => {
        acc[booking.seasonType] = (acc[booking.seasonType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      groupSizeBreakdown: data.reduce((acc, booking) => {
        acc[booking.groupSize] = (acc[booking.groupSize] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      healthConcerns: {
        withMedicalConditions: data.filter(b => b.medicalConditions !== 'None reported').length,
        withMedications: data.filter(b => b.currentMedications !== 'None reported').length,
        withRecentIllness: data.filter(b => b.recentIllnesses !== 'None reported').length,
        highRisk: data.filter(b => b.riskAssessment === 'High').length
      },
      logistics: {
        needTransportation: data.filter(b => b.needsTransportation === 'Yes').length,
        needGearRental: data.filter(b => b.gearRental === 'Yes').length,
        needPorterServices: data.filter(b => b.porterServices === 'Yes').length
      }
    },
    guideInsights: {
      highRiskBookings: data.filter(b => b.riskAssessment === 'High').map(b => ({
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        trekName: b.trekName,
        riskFactors: {
          medicalConditions: b.medicalConditions !== 'None reported',
          age: b.customerAge < 18 || b.customerAge > 60,
          inexperienced: b.experienceLevel === 'Beginner'
        }
      })),
      specialRequirements: data.filter(b => b.specialRequirements !== 'None').map(b => ({
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        requirements: b.specialRequirements
      })),
      emergencyContacts: data.map(b => ({
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        emergencyContact: b.emergencyContactName,
        emergencyPhone: b.emergencyContactPhone
      }))
    },
    bookings: data
  };

  const timestamp = new Date().toISOString().split('T')[0];

  return new NextResponse(JSON.stringify(exportObject, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="nomadic-travels-detailed-bookings-${timestamp}.json"`
    }
  });
}

function generateExcelExport(data: BookingExportData[]) {
  // For now, return CSV with Excel MIME type
  // In a full implementation, you'd use a library like xlsx
  const csvContent = generateCSVContent(data);
  const timestamp = new Date().toISOString().split('T')[0];

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="nomadic-travels-bookings-${timestamp}.xls"`
    }
  });
}

function generatePDFExport(data: BookingExportData[]) {
  const timestamp = new Date().toISOString().split('T')[0];
  const totalRevenue = data.reduce((sum, booking) => sum + booking.totalAmount, 0);
  const totalParticipants = data.reduce((sum, booking) => sum + booking.participants, 0);
  const highRiskCount = data.filter(b => b.riskAssessment === 'High').length;
  const medicalConcerns = data.filter(b => b.medicalConditions !== 'None reported').length;
  
  const pdfContent = `
Trek Hub India - DETAILED BOOKING REPORT FOR GUIDES
Generated: ${new Date().toLocaleString('en-IN')}
Report Date: ${timestamp}

${'='.repeat(80)}
EXECUTIVE SUMMARY
${'='.repeat(80)}

Total Bookings: ${data.length}
Total Participants: ${totalParticipants}
Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}
Average Group Size: ${Math.round(totalParticipants / data.length * 10) / 10}

SAFETY OVERVIEW:
• High Risk Bookings: ${highRiskCount} (${Math.round(highRiskCount / data.length * 100)}%)
• Medical Concerns: ${medicalConcerns} bookings
• Transportation Needed: ${data.filter(b => b.needsTransportation === 'Yes').length} bookings
• Gear Rental Required: ${data.filter(b => b.gearRental === 'Yes').length} bookings

${'='.repeat(80)}
HIGH PRIORITY - GUIDE ATTENTION REQUIRED
${'='.repeat(80)}

${data.filter(b => b.riskAssessment === 'High').length > 0 ? 
  data.filter(b => b.riskAssessment === 'High').map(booking => `
⚠️  HIGH RISK BOOKING: ${booking.bookingNumber}
Customer: ${booking.customerName} (Age: ${booking.customerAge})
Trek: ${booking.trekName}
Experience: ${booking.experienceLevel}
Medical: ${booking.medicalConditions}
Risk Factors: ${booking.riskAssessment}
Emergency Contact: ${booking.emergencyContactName} (${booking.emergencyContactPhone})
${'-'.repeat(60)}`).join('') : 
  'No high-risk bookings identified.'}

${'='.repeat(80)}
DETAILED BOOKING INFORMATION
${'='.repeat(80)}

${data.map((booking, index) => `
BOOKING #${index + 1} - ${booking.bookingNumber}
${'─'.repeat(50)}

📋 BASIC INFORMATION:
Booking Reference: ${booking.bookingReference}
Customer: ${booking.customerName} (${booking.customerAge} years, ${booking.customerGender})
Email: ${booking.customerEmail}
Phone: ${booking.customerPhone}
Address: ${booking.residentialAddress}
Booking Date: ${booking.bookingDate} at ${booking.bookingTime}
Status: ${booking.status} | Payment: ${booking.paymentStatus}

🏔️  TREK DETAILS:
Trek: ${booking.trekName}
Region: ${booking.trekRegion} | Difficulty: ${booking.trekDifficulty}
Duration: ${booking.trekDuration} | Season: ${booking.seasonType}
Trek Date: ${booking.trekDate}
Start Location: ${booking.trekStartLocation}
End Location: ${booking.trekEndLocation}

👥 GROUP INFORMATION:
Participants: ${booking.participants} (${booking.groupSize})
Participant Names: ${booking.participantNames}
Experience Level: ${booking.experienceLevel}
Trekking Experience: ${booking.trekkingExperience}

💰 FINANCIAL DETAILS:
Total Amount: ₹${booking.totalAmount.toLocaleString('en-IN')}
Base Amount: ₹${booking.baseAmount.toLocaleString('en-IN')}
GST: ₹${booking.gstAmount.toLocaleString('en-IN')}
Per Person: ₹${booking.amountPerPerson.toLocaleString('en-IN')}

🏥 HEALTH & SAFETY:
Risk Assessment: ${booking.riskAssessment}
Medical Conditions: ${booking.medicalConditions}
Current Medications: ${booking.currentMedications}
Recent Illnesses: ${booking.recentIllnesses}
Fitness Level: ${booking.fitnessLevel}

🚨 EMERGENCY CONTACT:
Name: ${booking.emergencyContactName}
Phone: ${booking.emergencyContactPhone}
Relation: ${booking.emergencyContactRelation}

🚐 LOGISTICS:
Pickup Location: ${booking.pickupLocation}
Transportation Needed: ${booking.needsTransportation}
Accommodation: ${booking.accommodationPreferences}
Special Requirements: ${booking.specialRequirements}

🎒 EQUIPMENT & SERVICES:
Gear Rental: ${booking.gearRental}
Porter Services: ${booking.porterServices}
Equipment Needed: ${booking.equipmentNeeded}

📊 SLOT INFORMATION:
Slot Date: ${booking.slotDate}
Capacity: ${booking.slotCapacity} | Booked: ${booking.slotBooked} | Available: ${booking.slotAvailable}
Utilization: ${booking.slotUtilization}

📝 GUIDE NOTES:
${booking.guideNotes}

🌤️  WEATHER:
${booking.weatherConditions}

📋 ADMINISTRATIVE:
Created By: ${booking.createdBy}
Last Modified: ${booking.lastModified}
Approved By: ${booking.approvedBy}
Approval Date: ${booking.approvalDate}

${'═'.repeat(70)}
`).join('')}

${'='.repeat(80)}
GUIDE CHECKLIST SUMMARY
${'='.repeat(80)}

□ Review all high-risk bookings (${highRiskCount} total)
□ Confirm emergency contacts for all participants
□ Prepare equipment for gear rentals (${data.filter(b => b.gearRental === 'Yes').length} bookings)
□ Arrange porter services (${data.filter(b => b.porterServices === 'Yes').length} bookings)
□ Coordinate transportation (${data.filter(b => b.needsTransportation === 'Yes').length} bookings)
□ Review medical conditions and medications
□ Check weather forecast for trek dates
□ Prepare group management for different experience levels
□ Confirm pickup locations and times
□ Review special requirements and accommodations

${'='.repeat(80)}
EMERGENCY CONTACT QUICK REFERENCE
${'='.repeat(80)}

${data.map(booking => `${booking.bookingNumber}: ${booking.customerName} → ${booking.emergencyContactName} (${booking.emergencyContactPhone})`).join('\n')}

${'='.repeat(80)}
End of Detailed Guide Report
Generated by Trek Hub India Admin System
${'='.repeat(80)}
  `.trim();

  return new NextResponse(pdfContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="nomadic-travels-guide-report-${timestamp}.txt"`
    }
  });
}

function generateCSVContent(data: BookingExportData[]): string {
  const headers = [
    'Booking Number', 'Customer Name', 'Email', 'Phone', 'Trek Name', 'Region',
    'Difficulty', 'Trek Date', 'Participants', 'Total Amount', 'Base Amount',
    'GST Amount', 'Status', 'Payment Status', 'Booking Date', 'Special Requirements',
    'Medical Conditions', 'Trekking Experience', 'Emergency Contact', 'Emergency Phone'
  ];

  const csvRows = [
    headers.join(','),
    ...data.map(row => [
      row.bookingNumber, `"${row.customerName}"`, row.customerEmail, row.customerPhone,
      `"${row.trekName}"`, row.trekRegion, row.trekDifficulty, row.trekDate,
      row.participants, row.totalAmount, row.baseAmount, row.gstAmount,
      row.status, row.paymentStatus, row.bookingDate, `"${row.specialRequirements}"`,
      `"${row.medicalConditions}"`, row.trekkingExperience, `"${row.emergencyContactName}"`,
      row.emergencyContactPhone
    ].join(','))
  ];

  return csvRows.join('\n');
}
