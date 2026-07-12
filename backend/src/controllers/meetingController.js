const Meeting = require('../models/Meeting');

// Helper function to check time overlap
const hasTimeConflict = (existingStart, existingEnd, newStart, newEnd) => {
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const existingStartMin = toMinutes(existingStart);
  const existingEndMin = toMinutes(existingEnd);
  const newStartMin = toMinutes(newStart);
  const newEndMin = toMinutes(newEnd);

  return newStartMin < existingEndMin && newEndMin > existingStartMin;
};

// @desc    Schedule a new meeting
// @route   POST /api/meetings
const scheduleMeeting = async (req, res) => {
  try {
    const { attendeeId, title, description, date, startTime, endTime, meetingLink } = req.body;

    // Check all required fields
    if (!attendeeId || !title || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    // Prevent scheduling a meeting with yourself
    if (attendeeId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot schedule a meeting with yourself' });
    }

    // Check end time is after start time
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Convert date to start and end of day for querying
    const meetingDate = new Date(date);
    const startOfDay = new Date(meetingDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(meetingDate.setHours(23, 59, 59, 999));

    // Find any accepted meetings for organizer or attendee on the same date
    const conflictingMeetings = await Meeting.find({
      status: 'accepted',
      date: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { organizer: req.user._id },
        { attendee: req.user._id },
        { organizer: attendeeId },
        { attendee: attendeeId },
      ],
    });

    // Check each found meeting for time overlap
    for (const meeting of conflictingMeetings) {
      if (hasTimeConflict(meeting.startTime, meeting.endTime, startTime, endTime)) {
        return res.status(400).json({
          message: 'This time slot conflicts with an existing meeting',
        });
      }
    }

    // Create the meeting
    const meeting = await Meeting.create({
      organizer: req.user._id,
      attendee: attendeeId,
      title,
      description,
      date,
      startTime,
      endTime,
      meetingLink: meetingLink || '',
    });

    // Populate organizer and attendee details before sending response
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizer', 'name email role profilePhoto')
      .populate('attendee', 'name email role profilePhoto');

    res.status(201).json(populatedMeeting);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all meetings for logged in user
// @route   GET /api/meetings
const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { organizer: req.user._id },
        { attendee: req.user._id },
      ],
    })
      .populate('organizer', 'name email role profilePhoto')
      .populate('attendee', 'name email role profilePhoto')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json(meetings);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single meeting
// @route   GET /api/meetings/:id
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name email role profilePhoto')
      .populate('attendee', 'name email role profilePhoto');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only organizer or attendee can view the meeting
    const isOrganizer = meeting.organizer._id.toString() === req.user._id.toString();
    const isAttendee = meeting.attendee._id.toString() === req.user._id.toString();

    if (!isOrganizer && !isAttendee) {
      return res.status(403).json({ message: 'Not authorized to view this meeting' });
    }

    res.status(200).json(meeting);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept a meeting
// @route   PUT /api/meetings/:id/accept
const acceptMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only the attendee can accept
    if (meeting.attendee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the attendee can accept this meeting' });
    }

    // Can only accept a pending meeting
    if (meeting.status !== 'pending') {
      return res.status(400).json({ message: `Meeting is already ${meeting.status}` });
    }

    // Check for conflicts before accepting
    const meetingDate = new Date(meeting.date);
    const startOfDay = new Date(meetingDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(meetingDate.setHours(23, 59, 59, 999));

    const conflictingMeetings = await Meeting.find({
      status: 'accepted',
      date: { $gte: startOfDay, $lte: endOfDay },
      _id: { $ne: meeting._id },
      $or: [
        { organizer: meeting.organizer },
        { attendee: meeting.organizer },
        { organizer: meeting.attendee },
        { attendee: meeting.attendee },
      ],
    });

    for (const existing of conflictingMeetings) {
      if (hasTimeConflict(existing.startTime, existing.endTime, meeting.startTime, meeting.endTime)) {
        return res.status(400).json({
          message: 'Cannot accept — this time slot conflicts with an existing meeting',
        });
      }
    }

    meeting.status = 'accepted';
    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizer', 'name email role profilePhoto')
      .populate('attendee', 'name email role profilePhoto');

    res.status(200).json(populatedMeeting);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a meeting
// @route   PUT /api/meetings/:id/reject
const rejectMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only the attendee can reject
    if (meeting.attendee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the attendee can reject this meeting' });
    }

    // Can only reject a pending meeting
    if (meeting.status !== 'pending') {
      return res.status(400).json({ message: `Meeting is already ${meeting.status}` });
    }

    meeting.status = 'rejected';
    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizer', 'name email role profilePhoto')
      .populate('attendee', 'name email role profilePhoto');

    res.status(200).json(populatedMeeting);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a meeting
// @route   DELETE /api/meetings/:id
const cancelMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only the organizer can cancel
    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the organizer can cancel this meeting' });
    }

    // Cannot cancel an already rejected meeting
    if (meeting.status === 'rejected') {
      return res.status(400).json({ message: 'Cannot cancel a rejected meeting' });
    }

    meeting.status = 'cancelled';
    await meeting.save();

    res.status(200).json({ message: 'Meeting cancelled successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  scheduleMeeting,
  getMeetings,
  getMeetingById,
  acceptMeeting,
  rejectMeeting,
  cancelMeeting,
};