const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');

// Ensure upload directory exists
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a safe filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExtension).replace(/[^a-zA-Z0-9]/g, '-');
        const fileName = baseName + '-' + uniqueSuffix + fileExtension;
        cb(null, fileName);
    }
});

const fileFilter = (req, file, cb) => {
    // Check if the file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Error handling middleware for Multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${error.message}`
        });
    } else if (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next();
};

// Get all items
router.get('/api', async (req, res) => {
    try {
        const { type, category, search, location, date, page = 1, limit = 12 } = req.query;
        let filter = { status: 'active' };
        
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (location) filter.location = new RegExp(location, 'i');
        if (date) filter.date = new Date(date);
        
        if (search) {
            filter.$or = [
                { title: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }
        
        const items = await Item.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await Item.countDocuments(filter);
        
        res.json({
            items,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new lost item
router.post('/lost', upload.single('image'), handleMulterError, async (req, res) => {
    try {
        console.log('=== LOST ITEM SUBMISSION ===');
        console.log('Form data:', req.body);
        console.log('Uploaded file:', req.file);
        console.log('Files in request:', req.files);

        // Validate required fields
        const requiredFields = ['itemName', 'description', 'category', 'location', 'date', 'contactName', 'contactEmail'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required field: ${field}`
                });
            }
        }

        const itemData = {
            type: 'lost',
            title: req.body.itemName,
            description: req.body.description,
            category: req.body.category,
            location: req.body.location,
            date: req.body.date,
            contactInfo: {
                name: req.body.contactName,
                email: req.body.contactEmail,
                phone: req.body.contactPhone || ''
            }
        };
        
        if (req.file) {
            itemData.image = `/uploads/${req.file.filename}`;
            console.log('Image saved with path:', itemData.image);
        } else {
            console.log('No image uploaded, using default image');
        }
        
        const item = new Item(itemData);
        const newItem = await item.save();
        
        console.log('Item saved successfully with ID:', newItem._id);
        
        // Check for potential matches
        await checkForMatches(newItem);
        
        res.json({ 
            success: true, 
            message: 'Lost item reported successfully!',
            item: newItem
        });
    } catch (error) {
        console.error('Error saving lost item:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Create new found item
router.post('/found', upload.single('image'), handleMulterError, async (req, res) => {
    try {
        console.log('=== FOUND ITEM SUBMISSION ===');
        console.log('Form data:', req.body);
        console.log('Uploaded file:', req.file);
        console.log('Files in request:', req.files);

        // Validate required fields
        const requiredFields = ['itemName', 'description', 'category', 'location', 'date', 'contactName', 'contactEmail'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required field: ${field}`
                });
            }
        }

        const itemData = {
            type: 'found',
            title: req.body.itemName,
            description: req.body.description,
            category: req.body.category,
            location: req.body.location,
            date: req.body.date,
            storageLocation: req.body.storageLocation || '',
            contactInfo: {
                name: req.body.contactName,
                email: req.body.contactEmail,
                phone: req.body.contactPhone || ''
            }
        };
        
        if (req.file) {
            itemData.image = `/uploads/${req.file.filename}`;
            console.log('Image saved with path:', itemData.image);
        } else {
            console.log('No image uploaded, using default image');
        }
        
        const item = new Item(itemData);
        const newItem = await item.save();
        
        console.log('Item saved successfully with ID:', newItem._id);
        
        // Check for potential matches
        await checkForMatches(newItem);
        
        res.json({ 
            success: true, 
            message: 'Found item reported successfully!',
            item: newItem
        });
    } catch (error) {
        console.error('Error saving found item:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get item by ID
router.get('/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Function to check for matches
async function checkForMatches(item) {
    try {
        const oppositeType = item.type === 'lost' ? 'found' : 'lost';
        
        // Find potential matches based on title, category, and location
        const potentialMatches = await Item.find({
            type: oppositeType,
            status: 'active',
            category: item.category,
            $or: [
                { title: new RegExp(item.title, 'i') },
                { description: new RegExp(item.title, 'i') },
                { title: new RegExp(item.description.split(' ')[0], 'i') } // First word of description
            ]
        });
        
        if (potentialMatches.length > 0) {
            console.log(`Found ${potentialMatches.length} potential matches for item: ${item.title}`);
            // In a real application, send email notifications here
        }
        
        return potentialMatches;
    } catch (error) {
        console.error('Error checking for matches:', error);
        return [];
    }
}
// Get all items
router.get('/api', async (req, res) => {
    try {
        const { type, category, search, location, date, page = 1, limit = 12 } = req.query;
        let filter = { status: 'active' };
        
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (location) filter.location = new RegExp(location, 'i');
        if (date) filter.date = new Date(date);
        
        if (search) {
            filter.$or = [
                { title: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }
        
        const items = await Item.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const total = await Item.countDocuments(filter);
        
        res.json({
            items,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
module.exports = router;