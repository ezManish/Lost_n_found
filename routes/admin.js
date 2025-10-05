const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// Admin login page
router.get('/login', (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.session.adminLoggedIn) {
    return res.redirect('/admin');
  }
  res.render('admin-login', { title: 'Admin Login' });
});

// Admin login handler
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Simple authentication - in production, use proper authentication
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.adminLoggedIn = true;
    req.session.adminUsername = username;
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/admin/login');
  });
});

// Admin dashboard
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    const stats = {
      total: await Item.countDocuments(),
      active: await Item.countDocuments({ status: 'active' }),
      resolved: await Item.countDocuments({ status: 'resolved' }),
      pending: await Item.countDocuments({ status: 'pending' }),
      lost: await Item.countDocuments({ type: 'lost' }),
      found: await Item.countDocuments({ type: 'found' })
    };

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      items: items || [],
      stats: stats || {}
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      items: [],
      stats: {}
    });
  }
});

// Update item status
router.put('/items/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, item });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete item
router.delete('/items/:id', authenticateAdmin, async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;