const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  signDocument,
  shareDocument,
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

// All document routes are protected
router.use(protect);

router.post('/upload', upload.single('document'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);
router.put('/:id/sign', signDocument);
router.put('/:id/share', shareDocument);

module.exports = router;