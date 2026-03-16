const express = require('express');
const router = express.Router();
const { getLocations, addLocation, deleteLocation } = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getLocations)
    .post(protect, authorize('admin'), addLocation);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteLocation);

module.exports = router;
