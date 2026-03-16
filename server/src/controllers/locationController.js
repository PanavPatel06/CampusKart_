const Location = require('../models/Location');

// @desc    Get all locations
// @route   GET /api/locations
// @access  Public
const getLocations = async (req, res) => {
    try {
        const locations = await Location.find({ isAvailable: true }).sort({ name: 1 });
        res.json(locations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a location
// @route   POST /api/locations
// @access  Private (Admin)
const addLocation = async (req, res) => {
    try {
        const { name } = req.body;
        console.log('[addLocation] Request:', name);

        const locationExists = await Location.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (locationExists) {
            res.status(400);
            throw new Error('Location already exists');
        }

        const location = await Location.create({ name });
        res.status(201).json(location);
    } catch (error) {
        console.error('[addLocation] Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a location
// @route   DELETE /api/locations/:id
// @access  Private (Admin)
const deleteLocation = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);

        if (location) {
            await Location.deleteOne({ _id: location._id });
            res.json({ message: 'Location removed' });
        } else {
            res.status(404);
            throw new Error('Location not found');
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLocations,
    addLocation,
    deleteLocation
};
