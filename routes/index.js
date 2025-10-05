const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Home page
router.get('/', async (req, res) => {
  try {
    const items = await Item.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(9);

    const stats = {
      lost: await Item.countDocuments({ type: 'lost', status: 'active' }),
      found: await Item.countDocuments({ type: 'found', status: 'active' }),
      resolved: await Item.countDocuments({ status: 'resolved' }),
      total: await Item.countDocuments()
    };

    res.render('index', {
      title: 'University Lost & Found',
      items: items || [],
      stats: stats || {}
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.render('index', {
      title: 'University Lost & Found',
      items: [],
      stats: {}
    });
  }
});

// Search items
router.get('/search', async (req, res) => {
  try {
    const { q, category, type, location, date } = req.query;
    let filter = { status: 'active' };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (location) filter.location = new RegExp(location, 'i');
    if (date) filter.date = new Date(date);

    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') }
      ];
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      items: items || [],
      count: items.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      items: [],
      count: 0
    });
  }
});

module.exports = router;