const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

// @desc    Upload a document
// @route   POST /api/documents/upload
const uploadDocument = async (req, res) => {
  try {
    // Check if file was actually uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const { title, sharedWith } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Document title is required' });
    }

    // Parse sharedWith - it comes as a JSON string from the form
    let sharedWithArray = [];
    if (sharedWith) {
      try {
        sharedWithArray = JSON.parse(sharedWith);
      } catch {
        sharedWithArray = [];
      }
    }

    const document = await Document.create({
      uploadedBy: req.user._id,
      sharedWith: sharedWithArray,
      title,
      fileUrl: req.file.path.replace(/\\/g, '/'),
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      status: sharedWithArray.length > 0 ? 'shared' : 'draft',
    });

    const populatedDocument = await Document.findById(document._id)
      .populate('uploadedBy', 'name email role profilePhoto')
      .populate('sharedWith', 'name email role profilePhoto');

    res.status(201).json(populatedDocument);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all documents for logged in user
// @route   GET /api/documents
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [
        { uploadedBy: req.user._id },
        { sharedWith: req.user._id },
      ],
    })
      .populate('uploadedBy', 'name email role profilePhoto')
      .populate('sharedWith', 'name email role profilePhoto')
      .populate('signedBy', 'name email role profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json(documents);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single document
// @route   GET /api/documents/:id
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email role profilePhoto')
      .populate('sharedWith', 'name email role profilePhoto')
      .populate('signedBy', 'name email role profilePhoto');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access
    const isOwner = document.uploadedBy._id.toString() === req.user._id.toString();
    const isSharedWith = document.sharedWith.some(
      (user) => user._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isSharedWith) {
      return res.status(403).json({ message: 'Not authorized to view this document' });
    }

    res.status(200).json(document);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only the uploader can delete
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the uploader can delete this document' });
    }

    // Delete the actual file from disk
    const filePath = path.join(__dirname, '../../..', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Document deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sign a document
// @route   PUT /api/documents/:id/sign
const signDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access to this document
    const isOwner = document.uploadedBy.toString() === req.user._id.toString();
    const isSharedWith = document.sharedWith.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isOwner && !isSharedWith) {
      return res.status(403).json({ message: 'Not authorized to sign this document' });
    }

    // Check if already signed
    if (document.status === 'signed') {
      return res.status(400).json({ message: 'Document is already signed' });
    }

    const { signature } = req.body;

    if (!signature) {
      return res.status(400).json({ message: 'Signature is required' });
    }

    document.signature = signature;
    document.signedBy = req.user._id;
    document.signedAt = new Date();
    document.status = 'signed';

    await document.save();

    const populatedDocument = await Document.findById(document._id)
      .populate('uploadedBy', 'name email role profilePhoto')
      .populate('sharedWith', 'name email role profilePhoto')
      .populate('signedBy', 'name email role profilePhoto');

    res.status(200).json(populatedDocument);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Share document with another user
// @route   PUT /api/documents/:id/share
const shareDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can share
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the uploader can share this document' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if already shared with this user
    if (document.sharedWith.includes(userId)) {
      return res.status(400).json({ message: 'Document already shared with this user' });
    }

    document.sharedWith.push(userId);
    document.status = 'shared';

    await document.save();

    const populatedDocument = await Document.findById(document._id)
      .populate('uploadedBy', 'name email role profilePhoto')
      .populate('sharedWith', 'name email role profilePhoto')
      .populate('signedBy', 'name email role profilePhoto');

    res.status(200).json(populatedDocument);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  signDocument,
  shareDocument,
};