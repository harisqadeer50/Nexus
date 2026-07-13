const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },

    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },

    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },

    fileType: {
      type: String,
      required: [true, 'File type is required'],
    },

    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },

    version: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: ['draft', 'shared', 'signed'],
      default: 'draft',
    },

    signature: {
      type: String,
      default: '',
    },

    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    signedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;