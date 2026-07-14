const express = require('express');
const router = express.Router();
const { getUserById, getEntrepreneurs, getInvestors, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/entrepreneurs', getEntrepreneurs);
router.get('/investors', getInvestors);
router.put('/profile', updateProfile);
router.get('/:id', getUserById);

module.exports = router;
