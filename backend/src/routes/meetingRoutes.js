const express = require('express');
const router = express.Router();
const {
  scheduleMeeting,
  getMeetings,
  getMeetingById,
  acceptMeeting,
  rejectMeeting,
  cancelMeeting,
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');

// All meeting routes are protected
router.use(protect);

router.post('/', scheduleMeeting);
router.get('/', getMeetings);
router.get('/:id', getMeetingById);
router.put('/:id/accept', acceptMeeting);
router.put('/:id/reject', rejectMeeting);
router.delete('/:id', cancelMeeting);

module.exports = router;