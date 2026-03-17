const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const uploadImage = require('../middleware/imageUploadMiddleware');

router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({
        message: 'File uploaded successfully',
        fileUrl: req.file.path,
        filename: req.file.filename,
    });
});

router.post('/image', uploadImage.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
    }
    res.json({
        message: 'Image uploaded successfully',
        imageUrl: req.file.path,
    });
});

module.exports = router;
