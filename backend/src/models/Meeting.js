const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },

    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Attendee is required'],
    },

    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    date: {
      type: Date,
      required: [true, 'Meeting date is required'],
    },

    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },

    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },

    meetingLink: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;