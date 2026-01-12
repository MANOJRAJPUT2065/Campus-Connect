import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Event from '../models/Event.js';
import Club from '../models/Club.js';
import EventRegistration from '../models/EventRegistration.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import PlacementOfficial from '../models/PlacementOfficial.js';
import PlacementStudent from '../models/PlacementStudent.js';

// Gemini init for AI-assisted column detection
let gemini = null;
try {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    gemini = new GoogleGenerativeAI(geminiKey);
    console.log('✅ Gemini AI initialized for column detection');
  }
} catch (e) {
  console.warn('⚠️ Gemini AI not available:', e.message);
  gemini = null;
}

// Helpers
const deriveBatchFromUsn = (usn) => {
  const normalized = (usn || '').trim().toUpperCase();
  const match = normalized.match(/\d{2}/); // first two-digit sequence
  if (!match) return null;
  const year = parseInt(match[0], 10);
  if (Number.isNaN(year)) return null;
  const admissionYear = 2000 + year;
  const passOutYear = admissionYear + 4;
  return {
    admissionYear,
    passOutYear,
    batchLabel: `${admissionYear}-${passOutYear}`
  };
};

// Safely convert CGPA-like values to numbers; returns null when invalid
const normalizeCgpa = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const resolveIndex = (headers, mappingValue, candidates) => {
  if (mappingValue) {
    const idx = headers.findIndex((h) => h === mappingValue.toLowerCase());
    if (idx >= 0) return idx;
  }
  
  // First try exact match
  const lower = candidates.map((c) => c.toLowerCase());
  let idx = headers.findIndex((h) => lower.includes(h));
  if (idx >= 0) return idx;
  
  // Then try partial match (contains) - more flexible for CGPA variations
  idx = headers.findIndex((h) => lower.some((c) => h.includes(c)));
  return idx;
};

// Use Gemini to detect column mapping when basic detection fails
const suggestMappingWithGemini = async (headers) => {
  if (!gemini) return {};
  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = gemini.getGenerativeModel({ model: modelName });
    const prompt = `You are analyzing CSV/Excel column headers from a placement/academic system.\n\n` +
      `Headers: ${JSON.stringify(headers)}\n\n` +
      `Identify which header corresponds to each field:\n` +
      `- usn: Student ID/Roll Number (might be in format like "1SI22AD009" or embedded in email like "chiragb.1si22ad009@gmail.com")\n` +
      `- name: Student full name or name field\n` +
      `- cgpa: Academic CGPA/GPA score (could be "Official CGPA", "BE Agg CGPA", "Aggregate CGPA", "Academic CGPA", etc.)\n` +
      `- branch: Department/Branch (could be "Branch", "BE Branch", "Department", "Dept", "Stream")\n` +
      `- batchYear: Graduation year, batch year, year of pass, passing year\n\n` +
      `Return EXACT column name from the headers list above as it appears (preserve case).\n` +
      `Return JSON format: { "usn": "exact header", "name": "exact header", "cgpa": "exact header", "branch": "exact header", "batchYear": "exact header" }\n` +
      `Only include fields where you found a matching header. Return ONLY valid JSON, no markdown.`;
    
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || '';
    const jsonText = text.trim().replace(/^```json/,'').replace(/^```/,'').replace(/```$/,'').trim();
    console.log('  🤖 Gemini raw response:', jsonText);
    const parsed = JSON.parse(jsonText);
    
    const map = {};
    Object.entries(parsed).forEach(([key, val]) => {
      if (val && typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        // Map cgpa to both enteredCgpa and officialCgpa
        if (key === 'cgpa') {
          map['enteredCgpa'] = lower;
          map['officialCgpa'] = lower;
        } else {
          map[key] = lower;
        }
      }
    });
    
    console.log('  ✅ Gemini detected mapping:', map);
    return map;
  } catch (e) {
    console.log('  ⚠️ Gemini detection failed:', e.message);
    return {};
  }
};

const parseCsvRows = async (buffer, mapping = {}) => {
  const text = buffer.toString('utf8');
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  console.log('📋 CSV Headers:', headers);

  let idx = { name: -1, usn: -1, branch: -1, batchYear: -1, enteredCgpa: -1, officialCgpa: -1 };
  
  // TRY GEMINI FIRST as primary detection method
  if (gemini) {
    console.log('  🚀 Trying Gemini AI detection first...');
    const aiMap = await suggestMappingWithGemini(headers);
    if (Object.keys(aiMap).length > 0) {
      idx.usn = headers.findIndex(h => h === aiMap.usn);
      idx.name = headers.findIndex(h => h === aiMap.name);
      idx.branch = headers.findIndex(h => h === aiMap.branch);
      idx.batchYear = headers.findIndex(h => h === aiMap.batchYear);
      idx.enteredCgpa = headers.findIndex(h => h === aiMap.enteredCgpa || h === aiMap.officialCgpa);
      idx.officialCgpa = idx.enteredCgpa;
      console.log('  ✅ Gemini indices:', idx);
    }
  }
  
  // FALLBACK to basic detection if Gemini didn't find key columns
  if (idx.usn < 0 || idx.enteredCgpa < 0) {
    console.log('  🔍 Gemini incomplete, using basic detection...');
    const idxCgpa = resolveIndex(headers, mapping.enteredCgpa || mapping.officialCgpa, [
      'cgpa', 'c.g.p.a', 'gpa', 'agg cgpa', 'aggregate cgpa', 'be agg cgpa', 
      'academic cgpa', 'official cgpa', 'student cgpa', 'entered cgpa'
    ]);
    if (idx.usn < 0) idx.usn = resolveIndex(headers, mapping.usn, ['usn', 'roll', 'roll no', 'rollno', 'student id', 'roll_no']);
    if (idx.name < 0) idx.name = resolveIndex(headers, mapping.name, ['name', 'student name', 'full name', 'student_name']);
    if (idx.branch < 0) idx.branch = resolveIndex(headers, mapping.branch, ['branch', 'dept', 'department', 'stream', 'be branch']);
    if (idx.batchYear < 0) idx.batchYear = resolveIndex(headers, mapping.batchYear, ['batch', 'batch year', 'year', 'graduating year', 'pass year', 'year of pass']);
    if (idx.enteredCgpa < 0) idx.enteredCgpa = idxCgpa;
    if (idx.officialCgpa < 0) idx.officialCgpa = idxCgpa;
    console.log('  📊 Basic detection indices:', idx);
  };

  console.log('  📌 Final CSV indices:', idx);
  console.log('  📋 Mapped headers:', {
    name: idx.name >= 0 ? headers[idx.name] : 'NOT FOUND',
    usn: idx.usn >= 0 ? headers[idx.usn] : 'NOT FOUND',
    branch: idx.branch >= 0 ? headers[idx.branch] : 'NOT FOUND',
    cgpa: idx.enteredCgpa >= 0 ? headers[idx.enteredCgpa] : 'NOT FOUND'
  });

  const rows = lines.slice(1).map((line, i) => {
    const cols = line.split(',').map((c) => c.trim());
    const row = {
      name: idx.name >= 0 ? cols[idx.name] : undefined,
      usn: idx.usn >= 0 ? cols[idx.usn] : undefined,
      branch: idx.branch >= 0 ? cols[idx.branch] : undefined,
      batchYear: idx.batchYear >= 0 ? cols[idx.batchYear] : undefined,
      enteredCgpa: idx.enteredCgpa >= 0 ? cols[idx.enteredCgpa] : undefined,
      officialCgpa: idx.officialCgpa >= 0 ? cols[idx.officialCgpa] : undefined,
    };
    if (i < 3) {
      console.log(`  Row ${i+1}:`, {
        rawCols: cols,
        parsed: row,
        idxUsed: { name: idx.name, usn: idx.usn, cgpa: idx.enteredCgpa }
      });
    }
    return row;
  });

  const filtered = rows.filter((r) => (r.usn || '').trim().length > 0);
  console.log(`  CSV: ${rows.length} total rows, ${filtered.length} with valid USN`);
  return filtered;
};

const parseExcelRows = async (buffer, mapping = {}) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers = headerRow.values
    .filter(Boolean)
    .map((h) => String(h).trim().toLowerCase());
  
  console.log('📊 Excel Headers:', headers);

  let idx = { name: -1, usn: -1, branch: -1, batchYear: -1, enteredCgpa: -1, officialCgpa: -1 };
  
  // TRY GEMINI FIRST as primary detection method
  if (gemini) {
    console.log('  🚀 Trying Gemini AI detection first...');
    const aiMap = await suggestMappingWithGemini(headers);
    if (Object.keys(aiMap).length > 0) {
      // Excel is 1-indexed, so add 1 to array index
      const findExcelIdx = (headerName) => {
        const arrIdx = headers.findIndex(h => h === headerName);
        return arrIdx >= 0 ? arrIdx + 1 : -1;
      };
      idx.usn = findExcelIdx(aiMap.usn);
      idx.name = findExcelIdx(aiMap.name);
      idx.branch = findExcelIdx(aiMap.branch);
      idx.batchYear = findExcelIdx(aiMap.batchYear);
      idx.enteredCgpa = findExcelIdx(aiMap.enteredCgpa || aiMap.officialCgpa);
      idx.officialCgpa = idx.enteredCgpa;
      console.log('  ✅ Gemini indices (1-indexed):', idx);
    }
  }
  
  // FALLBACK to basic detection if Gemini didn't find key columns
  if (idx.usn < 0 || idx.enteredCgpa < 0) {
    console.log('  🔍 Gemini incomplete, using basic detection...');
    const idxCgpa = resolveIndex(headers, mapping.enteredCgpa || mapping.officialCgpa, [
      'cgpa', 'c.g.p.a', 'gpa', 'agg cgpa', 'aggregate cgpa', 'be agg cgpa',
      'academic cgpa', 'official cgpa', 'student cgpa', 'entered cgpa'
    ]);
    // Add 1 for Excel 1-indexing
    if (idx.usn < 0) { const i = resolveIndex(headers, mapping.usn, ['usn', 'roll', 'roll no', 'rollno', 'student id', 'roll_no']); idx.usn = i >= 0 ? i + 1 : -1; }
    if (idx.name < 0) { const i = resolveIndex(headers, mapping.name, ['name', 'student name', 'full name', 'student_name']); idx.name = i >= 0 ? i + 1 : -1; }
    if (idx.branch < 0) { const i = resolveIndex(headers, mapping.branch, ['branch', 'dept', 'department', 'stream', 'be branch']); idx.branch = i >= 0 ? i + 1 : -1; }
    if (idx.batchYear < 0) { const i = resolveIndex(headers, mapping.batchYear, ['batch', 'batch year', 'year', 'graduating year', 'pass year', 'year of pass']); idx.batchYear = i >= 0 ? i + 1 : -1; }
    if (idx.enteredCgpa < 0) idx.enteredCgpa = idxCgpa >= 0 ? idxCgpa + 1 : -1;
    if (idx.officialCgpa < 0) idx.officialCgpa = idx.enteredCgpa;
    console.log('  📊 Basic detection indices:', idx);
  }

  console.log('  📌 Final Excel indices:', idx);
  console.log('  📋 Mapped headers:', {
    name: idx.name > 0 ? headers[idx.name - 1] : 'NOT FOUND',
    usn: idx.usn > 0 ? headers[idx.usn - 1] : 'NOT FOUND',
    branch: idx.branch > 0 ? headers[idx.branch - 1] : 'NOT FOUND',
    cgpa: idx.enteredCgpa > 0 ? headers[idx.enteredCgpa - 1] : 'NOT FOUND'
  });

  const rows = [];
  let rowCount = 0;
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip headers
    const values = row.values.map((v) => (typeof v === 'string' ? v.trim() : v));
    const parsedRow = {
      name: idx.name > 0 ? values[idx.name] : undefined,
      usn: idx.usn > 0 ? values[idx.usn] : undefined,
      branch: idx.branch > 0 ? values[idx.branch] : undefined,
      batchYear: idx.batchYear > 0 ? values[idx.batchYear] : undefined,
      enteredCgpa: idx.enteredCgpa > 0 ? values[idx.enteredCgpa] : undefined,
      officialCgpa: idx.officialCgpa > 0 ? values[idx.officialCgpa] : undefined,
    };
    
    if (rowCount < 3) {
      console.log(`  Row ${rowNumber}:`, {
        rawValues: values,
        parsed: parsedRow,
        idxUsed: { name: idx.name, usn: idx.usn, cgpa: idx.enteredCgpa }
      });
    }
    
    rows.push(parsedRow);
    rowCount++;
  });

  console.log(`  📊 Excel parsed: ${rowCount} data rows processed`);

  const filtered = rows.filter((r) => (r.usn || '').toString().trim().length > 0);
  console.log(`  Excel: ${rows.length} total rows, ${filtered.length} with valid USN`);
  return filtered;
};

const parseUploadRows = async (file, mapping) => {
  const ext = (file.originalname || '').toLowerCase();
  console.log(`  📄 File extension: ${ext}`);
  let rows;
  if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
    console.log('  Using Excel parser...');
    rows = await parseExcelRows(file.buffer, mapping);
  } else {
    console.log('  Using CSV parser...');
    rows = await parseCsvRows(file.buffer, mapping);
  }
  console.log(`  ✓ Parsed ${rows.length} rows total`);
  return rows;
};

/**
 * CLUB MANAGEMENT CONTROLLERS
 */

// Create club
export const createClub = async (req, res) => {
  try {
    const { clubName, clubCode, description, category, contactEmail, contactPhone } = req.body;
    
    // Check if club code already exists
    const existingClub = await Club.findOne({ clubCode: clubCode.toUpperCase() });
    if (existingClub) {
      return res.status(409).json({
        success: false,
        message: 'Club code already exists'
      });
    }
    
    const club = new Club({
      clubName,
      clubCode: clubCode.toUpperCase(),
      description,
      category,
      contactEmail: contactEmail || req.user.email,
      contactPhone,
      coordinators: [{
        userId: req.user.userId || req.user.email,
        name: req.user.username,
        email: req.user.email,
        role: 'president',
        joinedDate: new Date()
      }],
      status: 'active'
    });
    
    await club.save();
    
    // Update user's clubsManaged
    await User.findOneAndUpdate(
      { email: req.user.email },
      { $push: { clubsManaged: club._id } }
    );
    
    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      club
    });
  } catch (error) {
    console.error('Error creating club:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create club',
      error: error.message
    });
  }
};

// Get coordinator's clubs
export const getCoordinatorClubs = async (req, res) => {
  try {
    const clubs = await Club.find({
      'coordinators.userId': req.user.userId || req.user.email,
      status: { $ne: 'archived' }
    })
    .populate('events', 'eventName eventDate status')
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: clubs.length,
      clubs
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clubs',
      error: error.message
    });
  }
};

// Get club details
export const getClubDetails = async (req, res) => {
  try {
    const { clubId } = req.params;
    
    const club = await Club.findById(clubId)
      .populate('coordinators.userId', 'username email profilePicUrl')
      .populate('members.userId', 'username email usn profilePicUrl department semester')
      .populate('events', 'eventName eventDate status registrations');
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check authorization
    const isCoordinator = club.isCoordinator(req.user.userId || req.user.email);
    if (!isCoordinator && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    res.status(200).json({
      success: true,
      club
    });
  } catch (error) {
    console.error('Error fetching club details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club details',
      error: error.message
    });
  }
};

// Add member to club
export const addClubMember = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { userId, name, email, usn, department, semester, membershipType } = req.body;
    
    const club = await Club.findById(clubId);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check authorization
    const isCoordinator = club.isCoordinator(req.user.userId || req.user.email);
    if (!isCoordinator && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    club.addMember({
      userId,
      name,
      email,
      usn,
      department,
      semester,
      membershipType: membershipType || 'regular'
    });
    
    await club.save();
    
    // Send notification to new member
    await Notification.createForUsers({
      title: 'Club Membership',
      message: `You have been added to ${club.clubName}`,
      type: 'general',
      senderId: req.user.userId || req.user.email,
      senderName: req.user.username,
      senderRole: 'coordinator',
      relatedEntity: {
        entityType: 'club',
        entityId: club._id
      }
    }, [userId]);
    
    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      club
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add member',
      error: error.message
    });
  }
};

/**
 * EVENT MANAGEMENT CONTROLLERS
 */

// Create event
export const createEvent = async (req, res) => {
  try {
    const eventData = req.body;
    
    const event = new Event({
      ...eventData,
      coordinatorId: req.user.userId || req.user.email,
      coordinatorEmail: req.user.email,
      clubCoordinator: req.user.username,
      status: eventData.status || 'draft',
      requiresApproval: eventData.requiresApproval || false,
      autoApprove: eventData.autoApprove !== undefined ? eventData.autoApprove : true
    });
    
    await event.save();
    
    // If clubId is provided, add event to club
    if (eventData.clubId) {
      await Club.findByIdAndUpdate(
        eventData.clubId,
        { 
          $push: { events: event._id },
          $inc: { 'stats.totalEvents': 1, 'stats.upcomingEvents': 1 }
        }
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
};

// Get coordinator's events
export const getCoordinatorEvents = async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { coordinatorEmail: req.user.email };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const events = await Event.find(query)
      .populate('clubId', 'clubName clubCode')
      .sort({ eventDate: -1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};

// Get event with registrations
export const getEventWithRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId)
      .populate('registrations.userId', 'username email usn profilePicUrl department semester')
      .populate('clubId', 'clubName');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization
    if (event.coordinatorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message
    });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization
    if (event.coordinatorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Prevent changing coordinator
    delete updates.coordinatorId;
    delete updates.coordinatorEmail;
    
    Object.assign(event, updates);
    await event.save();
    
    // Notify registered participants if significant changes
    if (updates.eventDate || updates.eventTime || updates.venue) {
      const registeredUserIds = event.registrations
        .filter(r => r.approvalStatus === 'approved')
        .map(r => r.userId);
      
      if (registeredUserIds.length > 0) {
        await Notification.createForUsers({
          title: 'Event Updated',
          message: `${event.eventName} has been updated. Please check the details.`,
          type: 'event',
          priority: 'high',
          senderId: req.user.userId || req.user.email,
          senderName: req.user.username,
          senderRole: 'coordinator',
          relatedEntity: {
            entityType: 'event',
            entityId: event._id
          }
        }, registeredUserIds);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

// Approve participant
export const approveParticipant = async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization
    if (event.coordinatorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const registration = event.registrations.id(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    try {
      event.approveParticipant(registration.userId, req.user.userId || req.user.email);
      await event.save();
      
      // Send notification to participant
      await Notification.createForUsers({
        title: 'Registration Approved',
        message: `Your registration for ${event.eventName} has been approved!`,
        type: 'event',
        priority: 'high',
        senderId: req.user.userId || req.user.email,
        senderName: req.user.username,
        senderRole: 'coordinator',
        relatedEntity: {
          entityType: 'event',
          entityId: event._id
        }
      }, [registration.userId]);
      
      res.status(200).json({
        success: true,
        message: 'Participant approved successfully',
        event
      });
    } catch (error) {
      // Handle waitlist case
      if (error.message.includes('waitlist')) {
        await event.save();
        
        await Notification.createForUsers({
          title: 'Added to Waitlist',
          message: `Event is full. You've been added to the waitlist for ${event.eventName}`,
          type: 'event',
          priority: 'medium',
          senderId: req.user.userId || req.user.email,
          senderName: req.user.username,
          senderRole: 'coordinator',
          relatedEntity: {
            entityType: 'event',
            entityId: event._id
          }
        }, [registration.userId]);
        
        return res.status(200).json({
          success: true,
          message: 'Event full, participant added to waitlist',
          event
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error approving participant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve participant',
      error: error.message
    });
  }
};

// Reject participant
export const rejectParticipant = async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    const { reason } = req.body;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization
    if (event.coordinatorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const registration = event.registrations.id(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    event.rejectParticipant(registration.userId, reason, req.user.userId || req.user.email);
    await event.save();
    
    // Send notification to participant
    await Notification.createForUsers({
      title: 'Registration Not Approved',
      message: `Your registration for ${event.eventName} was not approved. ${reason || ''}`,
      type: 'event',
      priority: 'medium',
      senderId: req.user.userId || req.user.email,
      senderName: req.user.username,
      senderRole: 'coordinator',
      relatedEntity: {
        entityType: 'event',
        entityId: event._id
      }
    }, [registration.userId]);
    
    res.status(200).json({
      success: true,
      message: 'Participant rejected',
      event
    });
  } catch (error) {
    console.error('Error rejecting participant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject participant',
      error: error.message
    });
  }
};

/**
 * ANNOUNCEMENT CONTROLLERS
 */

// Send announcement to club members
export const sendClubAnnouncement = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { title, message, priority } = req.body;
    
    const club = await Club.findById(clubId);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check authorization
    const isCoordinator = club.isCoordinator(req.user.userId || req.user.email);
    if (!isCoordinator && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Get active member IDs
    const memberIds = club.members
      .filter(m => m.status === 'active')
      .map(m => m.userId);
    
    if (memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active members to send announcement to'
      });
    }
    
    // Create notification for all members
    await Notification.createForUsers({
      title,
      message,
      type: 'announcement',
      priority: priority || 'medium',
      senderId: req.user.userId || req.user.email,
      senderName: req.user.username,
      senderRole: 'coordinator',
      relatedEntity: {
        entityType: 'club',
        entityId: club._id
      }
    }, memberIds);
    
    res.status(200).json({
      success: true,
      message: `Announcement sent to ${memberIds.length} members`
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send announcement',
      error: error.message
    });
  }
};

// Send announcement to event participants
export const sendEventAnnouncement = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, message, priority, targetStatus } = req.body;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization
    if (event.coordinatorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Filter registrations by status
    let registrations = event.registrations;
    if (targetStatus) {
      registrations = registrations.filter(r => r.approvalStatus === targetStatus);
    }
    
    const participantIds = registrations.map(r => r.userId);
    
    if (participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No participants to send announcement to'
      });
    }
    
    // Create notification
    await Notification.createForUsers({
      title,
      message,
      type: 'announcement',
      priority: priority || 'medium',
      senderId: req.user.userId || req.user.email,
      senderName: req.user.username,
      senderRole: 'coordinator',
      relatedEntity: {
        entityType: 'event',
        entityId: event._id
      }
    }, participantIds);
    
    res.status(200).json({
      success: true,
      message: `Announcement sent to ${participantIds.length} participants`
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send announcement',
      error: error.message
    });
  }
};

/**
 * ANALYTICS CONTROLLERS
 */

// Get coordinator dashboard analytics
export const getCoordinatorAnalytics = async (req, res) => {
  try {
    const coordinatorEmail = req.user.email;
    
    // Get clubs
    const clubs = await Club.find({
      'coordinators.email': coordinatorEmail,
      status: 'active'
    });
    
    // Get events
    const events = await Event.find({
      coordinatorEmail,
      status: { $ne: 'cancelled' }
    });
    
    // Calculate statistics
    const totalClubs = clubs.length;
    const totalMembers = clubs.reduce((sum, c) => sum + c.stats.activeMembers, 0);
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => new Date(e.eventDate) > new Date()).length;
    const completedEvents = events.filter(e => e.status === 'completed').length;
    
    const pendingApprovals = events.reduce((sum, e) => {
      return sum + e.registrations.filter(r => r.approvalStatus === 'pending').length;
    }, 0);
    
    const totalRegistrations = events.reduce((sum, e) => sum + e.registrations.length, 0);
    
    res.status(200).json({
      success: true,
      analytics: {
        totalClubs,
        totalMembers,
        totalEvents,
        upcomingEvents,
        completedEvents,
        pendingApprovals,
        totalRegistrations,
        recentEvents: events
          .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
          .slice(0, 5),
        clubs: clubs.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

/**
 * PLACEMENT / CGPA VERIFICATION
 */

// Get students with CGPA details, flagging suspicious entries for the placement cell
export const getPlacementStudents = async (req, res) => {
  try {
    const { minCgpa, maxCgpa, flaggedOnly, search } = req.query;

    const cgpaFilter = {};
    const min = Number(minCgpa);
    const max = Number(maxCgpa);
    if (!Number.isNaN(min)) cgpaFilter.$gte = min;
    if (!Number.isNaN(max)) cgpaFilter.$lte = max;

    const query = { role: 'student' };
    if (Object.keys(cgpaFilter).length > 0) {
      query.cgpa = cgpaFilter;
    }

    const students = await User.find(query)
      .select('username email usn department semester cgpa cgpaVerified cgpaFlagReason cgpaProofUrl cgpaLastUpdated')
      .sort({ cgpa: -1 });

    const term = (search || '').trim().toLowerCase();

    const enriched = students
      .map((student) => {
        const data = student.toObject();
        const issues = [];

        if (data.cgpa === undefined || data.cgpa === null) {
          issues.push('CGPA missing');
        }
        if (data.cgpa < 0 || data.cgpa > 10) {
          issues.push('Out of valid range (0-10)');
        }
        if (!data.cgpaVerified && !data.cgpaProofUrl) {
          issues.push('Proof not provided');
        }

        const flagged = issues.length > 0 || !!data.cgpaFlagReason;

        return {
          ...data,
          issues,
          flagged,
        };
      })
      .filter((student) => {
        if (flaggedOnly === 'true' && !student.flagged) {
          return false;
        }

        if (!term) return true;
        return (
          (student.username || '').toLowerCase().includes(term) ||
          (student.usn || '').toLowerCase().includes(term) ||
          (student.email || '').toLowerCase().includes(term)
        );
      });

    res.status(200).json({
      success: true,
      count: enriched.length,
      students: enriched,
    });
  } catch (error) {
    console.error('Error fetching placement students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch placement data',
      error: error.message,
    });
  }
};

// Mark a student's CGPA as verified or flag it with a note
export const verifyStudentCgpa = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { verified, note } = req.body;

    const orConditions = [{ usn: (studentId || '').toLowerCase() }];
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      orConditions.push({ _id: studentId });
    }

    const student = await User.findOneAndUpdate(
      { $or: orConditions, role: 'student' },
      {
        cgpaVerified: !!verified,
        cgpaFlagReason: verified ? null : (note || 'Flagged by coordinator'),
      },
      {
        new: true,
        select: 'username email usn department semester cgpa cgpaVerified cgpaFlagReason cgpaProofUrl cgpaLastUpdated',
      }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({ success: true, student });
  } catch (error) {
    console.error('Error verifying CGPA:', error);
    res.status(500).json({ success: false, message: 'Failed to update CGPA verification' });
  }
};

// Upload and validate placement CSV/Excel against official CGPA and batch year derived from USN
export const validatePlacementCsv = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'CSV or Excel file is required' });
    }

    let mapping = {};
    if (req.body?.mapping) {
      try {
        mapping = JSON.parse(req.body.mapping);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid mapping JSON' });
      }
    }

    const rows = await parseUploadRows(req.file, mapping);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data rows found in file' });
    }

    // Collect USNs for lookup
    const usnList = rows
      .map((r) => String(r?.usn ?? '').trim().toLowerCase())
      .filter((v, i, arr) => v && arr.indexOf(v) === i);

    const students = await User.find({ usn: { $in: usnList }, role: 'student' })
      .select('username email usn department semester cgpa cgpaVerified cgpaFlagReason cgpaProofUrl cgpaLastUpdated');

    const map = new Map();
    students.forEach((s) => {
      map.set((s.usn || '').toLowerCase(), s);
    });

    const results = rows.map((row) => {
      const normalizedUsn = String(row?.usn ?? '').trim();
      const key = normalizedUsn.toLowerCase();
      const official = map.get(key);
      const enteredCgpa = row.enteredCgpa !== undefined && row.enteredCgpa !== '' ? Number(row.enteredCgpa) : NaN;
      const officialCgpa = official?.cgpa;

      const batchInfo = deriveBatchFromUsn(normalizedUsn);
      const providedBatch = row.batchYear ? String(row.batchYear).trim() : null;
      const batchMismatch = providedBatch && batchInfo && !providedBatch.includes(String(batchInfo.admissionYear));

      const issues = [];
      let status = 'Matched';
      let eligibleForCgpaFilter = false;

      if (!official) {
        status = 'Not Found';
        issues.push('Student not found in system');
      } else if (officialCgpa === undefined || officialCgpa === null) {
        status = 'Missing Official CGPA';
        issues.push('Official CGPA not available');
      } else if (Number.isNaN(enteredCgpa)) {
        status = 'Missing Entered CGPA';
        issues.push('Entered CGPA missing or invalid');
      } else if (enteredCgpa !== officialCgpa || enteredCgpa > officialCgpa) {
        status = enteredCgpa > officialCgpa ? 'Manipulated' : 'CGPA Mismatch';
        issues.push(`Entered ${enteredCgpa} vs official ${officialCgpa}`);
      }

      if (batchMismatch) {
        issues.push(`Batch mismatch. Derived ${batchInfo?.batchLabel || 'N/A'} vs provided ${providedBatch}`);
        if (status === 'Matched') {
          status = 'Batch Mismatch';
        }
      }

      const flagged = status !== 'Matched' || issues.length > 0;
      eligibleForCgpaFilter = !flagged && official?.cgpaVerified === true;

      return {
        name: row.name || official?.username,
        usn: normalizedUsn,
        branch: row.branch || official?.department,
        providedBatchYear: providedBatch,
        derivedBatch: batchInfo ? batchInfo.batchLabel : null,
        enteredCgpa: Number.isNaN(enteredCgpa) ? null : enteredCgpa,
        officialCgpa: officialCgpa ?? null,
        cgpaVerified: official?.cgpaVerified || false,
        status,
        issues,
        flagged,
        eligibleForCgpaFilter,
      };
    });

    res.status(200).json({
      success: true,
      count: results.length,
      rows: results,
    });
  } catch (error) {
    console.error('Error validating placement CSV:', error);
    res.status(500).json({ success: false, message: 'Failed to validate CSV', error: error.message });
  }
};

/**
 * OFFICIAL VS STUDENT PLACEMENT UPLOADS AND RECONCILIATION
 */

export const uploadOfficialPlacement = async (req, res) => {
  try {
    console.log('\n📤 Official Upload Request:');
    console.log('  File:', req.file?.originalname, `(${req.file?.size} bytes)`);
    
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    let mapping = {};
    if (req.body?.mapping) {
      try {
        mapping = JSON.parse(req.body.mapping);
        console.log('  Mapping:', mapping);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid mapping JSON' });
      }
    }

    const rows = await parseUploadRows(req.file, mapping);
    console.log(`  Parsed ${rows.length} rows from file`);
    if (rows.length > 0) {
      console.log('  Sample row:', rows[0]);
    }
    
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data rows found in file' });
    }

    const uploadId = new mongoose.Types.ObjectId();
    let skipped = 0;
    const bulk = rows
      .map((row) => {
        const usn = String(row?.usn ?? '').trim().toLowerCase();
        if (!usn) {
          skipped += 1;
          return null;
        }
        const cgpaNum = normalizeCgpa(row.officialCgpa ?? row.enteredCgpa ?? row.cgpa);
        const batchInfo = deriveBatchFromUsn(usn);
        if (skipped < 3) {
          console.log(`Official row: usn=${usn}, rawCgpa=${row.officialCgpa ?? row.enteredCgpa ?? row.cgpa}, normalized=${cgpaNum}`);
        }
        const updateSet = {
          name: row.name,
          branch: row.branch,
          batchYear: row.batchYear || batchInfo?.batchLabel,
          derivedBatch: batchInfo?.batchLabel,
          uploadId,
          uploadedBy: req.user.email,
        };
        if (cgpaNum !== null) {
          updateSet.officialCgpa = cgpaNum;
        }
        return {
          updateOne: {
            filter: { usn },
            update: { $set: updateSet },
            upsert: true,
          },
        };
      })
      .filter(Boolean);

    if (bulk.length > 0) {
      console.log(`  Saving ${bulk.length} bulk operations to DB...`);
      await PlacementOfficial.bulkWrite(bulk);
      console.log(`  ✅ Saved ${bulk.length} official records`);
    }

    console.log(`📊 Official upload complete: ${bulk.length} saved, ${skipped} skipped\n`);
    res.status(200).json({ success: true, count: bulk.length, skipped, uploadId });
  } catch (error) {
    console.error('Error uploading official placement file:', error);
    res.status(500).json({ success: false, message: 'Failed to upload official file', error: error.message });
  }
};

export const uploadStudentPlacement = async (req, res) => {
  try {
    console.log('\n📤 Student Upload Request:');
    console.log('  File:', req.file?.originalname, `(${req.file?.size} bytes)`);
    console.log('  Company:', req.body?.companyId || req.body?.companyName);
    
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const { companyId, companyName } = req.body;
    const finalCompanyId = companyId || companyName || 'default-company';
    const finalCompanyName = companyName || companyId || 'Default Company';
    
    console.log('Student upload request:', { companyId, companyName, finalCompanyId, finalCompanyName });

    let mapping = {};
    if (req.body?.mapping) {
      try {
        mapping = JSON.parse(req.body.mapping);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid mapping JSON' });
      }
    }

    const rows = await parseUploadRows(req.file, mapping);
    console.log(`  Parsed ${rows.length} student rows from file`);
    if (rows.length > 0) {
      console.log('  Sample row:', rows[0]);
    }
    
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data rows found in file' });
    }

    const uploadId = new mongoose.Types.ObjectId();
    let skipped = 0;
    const bulk = rows
      .map((row) => {
        const usn = String(row?.usn ?? '').trim().toLowerCase();
        if (!usn) {
          skipped += 1;
          return null;
        }
        const enteredCgpa = normalizeCgpa(row.enteredCgpa ?? row.cgpa ?? row.officialCgpa);
        const batchInfo = deriveBatchFromUsn(usn);
        const updateSet = {
          name: row.name,
          branch: row.branch,
          batchYear: row.batchYear || batchInfo?.batchLabel,
          derivedBatch: batchInfo?.batchLabel,
          enteredCgpa: enteredCgpa ?? null,
          companyId: finalCompanyId,
          companyName: finalCompanyName,
          uploadId,
          uploadedBy: req.user.email,
        };
        return {
          updateOne: {
            filter: { usn, companyId: finalCompanyId },
            update: { $set: updateSet },
            upsert: true,
          },
        };
      })
      .filter(Boolean);

    if (bulk.length > 0) {
      console.log(`  Saving ${bulk.length} bulk operations to DB...`);
      await PlacementStudent.bulkWrite(bulk);
      console.log(`  ✅ Saved ${bulk.length} student records`);
    }

    console.log(`📋 Student upload complete: ${bulk.length} saved, ${skipped} skipped\n`);
    res.status(200).json({ success: true, count: bulk.length, skipped, uploadId });
  } catch (error) {
    console.error('Error uploading student placement file:', error);
    res.status(500).json({ success: false, message: 'Failed to upload student file', error: error.message });
  }
};

export const reconcilePlacement = async (req, res) => {
  try {
    const { companyId, flaggedOnly, minCgpa, search, batch, mismatchOnly } = req.query;
    console.log('Reconcile request:', { companyId, flaggedOnly, minCgpa, search, batch, mismatchOnly });

    const studentQuery = companyId ? { companyId } : {};
    const [official, student] = await Promise.all([
      PlacementOfficial.find({}).lean(),
      PlacementStudent.find(studentQuery).lean(),
    ]);

    console.log(`Found ${official.length} official records, ${student.length} student records`);
    if (official.length > 0) console.log('Sample official:', official[0]);
    if (student.length > 0) console.log('Sample student:', student[0]);

    // Require both datasets present before validation
    if (official.length === 0) {
      return res.status(400).json({ success: false, message: 'Upload official academics file before validation.' });
    }
    if (student.length === 0) {
      return res.status(400).json({ success: false, message: companyId ? `Upload student/company file for ${companyId} before validation.` : 'Upload student/company file before validation.' });
    }

    const officialMap = new Map();
    official.forEach((o) => officialMap.set((o.usn || '').toLowerCase(), o));

    const rows = student.map((s, idx) => {
      const key = (s.usn || '').toLowerCase();
      const off = officialMap.get(key);
      const entered = Number(s.enteredCgpa);
      const officialCgpa = off ? Number(off.officialCgpa) : null;

      // Debug logging for first 3 rows
      if (idx < 3) {
        console.log(`\n🔍 Reconcile Row ${idx + 1}:`, {
          usn: s.usn,
          raw_entered: s.enteredCgpa,
          raw_official: off?.officialCgpa,
          parsed_entered: entered,
          parsed_official: officialCgpa,
          entered_isNaN: Number.isNaN(entered),
          official_isNull: officialCgpa === null,
          official_isNaN: Number.isNaN(officialCgpa),
          comparison: entered === officialCgpa ? 'MATCH' : `MISMATCH (${entered} vs ${officialCgpa})`
        });
      }

      const issues = [];
      let status = 'Matched';

      if (!off) {
        status = 'Missing Official';
        issues.push('No official record found');
      } else if (officialCgpa === null || Number.isNaN(officialCgpa)) {
        status = 'Missing Official CGPA';
        issues.push('Official CGPA not available');
      } else if (Number.isNaN(entered)) {
        status = 'Missing Entered CGPA';
        issues.push('Entered CGPA missing');
      } else if (entered > officialCgpa) {
        status = 'Manipulated';
        issues.push(`Entered ${entered} > official ${officialCgpa}`);
      } else if (entered !== officialCgpa) {
        status = 'CGPA Mismatch';
        issues.push(`Entered ${entered} vs official ${officialCgpa}`);
      }

      const derivedBatch = s.derivedBatch || off?.derivedBatch;
      const batchMismatch = batch && derivedBatch && derivedBatch !== batch;
      if (batchMismatch) {
        issues.push(`Batch mismatch: ${derivedBatch} vs filter ${batch}`);
        if (status === 'Matched') status = 'Batch Mismatch';
      }

      const flagged = status !== 'Matched' || issues.length > 0;
      const eligibleForCgpaFilter = !flagged && !Number.isNaN(entered) && officialCgpa !== null && !Number.isNaN(officialCgpa);

      return {
        usn: s.usn,
        name: s.name || off?.name,
        branch: s.branch || off?.branch,
        derivedBatch,
        batchYear: s.batchYear || off?.batchYear,
        enteredCgpa: Number.isNaN(entered) ? null : entered,
        officialCgpa: officialCgpa ?? null,
        status,
        issues,
        flagged,
        eligibleForCgpaFilter,
        companyId: s.companyId,
        companyName: s.companyName,
      };
    });

    // Apply filters (prefer mismatch-only if requested)
    let filtered = rows;
    const mismatchOnlyBool = String(mismatchOnly).toLowerCase() === 'true';
    const flaggedOnlyBool = String(flaggedOnly).toLowerCase() === 'true';
    const minCg = minCgpa !== undefined ? Number(minCgpa) : undefined;
    const searchTerm = (search || '').toString().trim().toLowerCase();

    if (mismatchOnlyBool) {
      filtered = filtered.filter((r) => r.status === 'CGPA Mismatch' || r.status === 'Manipulated');
    } else if (flaggedOnlyBool) {
      filtered = filtered.filter((r) => r.flagged);
    }

    if (minCg !== undefined && Number.isFinite(minCg) && minCg > 0) {
      filtered = filtered.filter((r) => r.eligibleForCgpaFilter && r.officialCgpa !== null && !Number.isNaN(r.officialCgpa) && r.officialCgpa >= minCg);
    }

    if (searchTerm) {
      filtered = filtered.filter((r) => (r.usn || '').toLowerCase().includes(searchTerm) || (r.name || '').toLowerCase().includes(searchTerm));
    }

    if (batch) filtered = filtered.filter((r) => r.derivedBatch === batch);

    console.log(`\n📊 Reconciliation Summary:`);
    console.log(`  Total student records: ${rows.length}`);
    console.log(`  Matched: ${rows.filter(r => r.status === 'Matched').length}`);
    console.log(`  CGPA Mismatches: ${rows.filter(r => r.status === 'CGPA Mismatch').length}`);
    console.log(`  Manipulated: ${rows.filter(r => r.status === 'Manipulated').length}`);
    console.log(`  Missing Official: ${rows.filter(r => r.status === 'Missing Official').length}`);
    console.log(`  Missing Official CGPA: ${rows.filter(r => r.status === 'Missing Official CGPA').length}`);
    console.log(`  After filters applied: ${filtered.length} records returned`);

    res.status(200).json({
      success: true,
      count: filtered.length,
      rows: filtered,
      officialData: official.map(o => ({
        usn: o.usn,
        name: o.name,
        branch: o.branch,
        batchYear: o.batchYear,
        derivedBatch: o.derivedBatch,
        officialCgpa: o.officialCgpa
      })),
      studentData: student.map(s => ({
        usn: s.usn,
        name: s.name,
        branch: s.branch,
        batchYear: s.batchYear,
        derivedBatch: s.derivedBatch,
        enteredCgpa: s.enteredCgpa,
        companyId: s.companyId,
        companyName: s.companyName
      }))
    });
  } catch (error) {
    console.error('Error reconciling placement data:', error);
    res.status(500).json({ success: false, message: 'Failed to reconcile placement data', error: error.message });
  }
};

// Remove placement uploads to free storage; scopes: all | official | student (student can be filtered by companyId)
export const purgePlacementUploads = async (req, res) => {
  try {
    const { scope = 'all', companyId } = req.body || {};

    const doOfficial = scope === 'all' || scope === 'official';
    const doStudent = scope === 'all' || scope === 'student';

    if (!doOfficial && !doStudent) {
      return res.status(400).json({ success: false, message: 'Invalid scope. Use all, official, or student' });
    }

    const results = {};

    if (doOfficial) {
      const r = await PlacementOfficial.deleteMany({});
      results.officialDeleted = r.deletedCount || 0;
    }

    if (doStudent) {
      const filter = companyId ? { companyId } : {};
      const r = await PlacementStudent.deleteMany(filter);
      results.studentDeleted = r.deletedCount || 0;
    }

    return res.status(200).json({ success: true, ...results });
  } catch (error) {
    console.error('Error purging placement uploads:', error);
    res.status(500).json({ success: false, message: 'Failed to purge placement uploads', error: error.message });
  }
};
