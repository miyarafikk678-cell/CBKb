const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Branch = require('../models/Branch');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function adminAuth(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ ok:false });
  const token = auth.split(' ')[1];
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    if(payload.role === 'admin'){ req.user = payload; return next(); }
    return res.status(403).json({ ok:false });
  } catch(e){ return res.status(401).json({ ok:false }); }
}

// create menu item (admin)
router.post('/:branchSlug', adminAuth, async (req, res) => {
  const branch = await Branch.findOne({ slug: req.params.branchSlug });
  if(!branch) return res.status(404).json({ ok:false, message:'branch not found' });
  // ensure admin belongs to same branch OR allow global admins
  // (we'll allow admin only if their token.branch equals branch slug)
  if(req.user.branch && req.user.branch !== branch.slug) return res.status(403).json({ ok:false, message:'not allowed' });
  const { name, price=0, description='' } = req.body;
  const item = await MenuItem.create({ branch: branch._id, name, price, description });
  res.json({ ok:true, item });
});

// list menu items for a branch
router.get('/:branchSlug', async (req, res) => {
  const branch = await Branch.findOne({ slug: req.params.branchSlug });
  if(!branch) return res.status(404).json({ ok:false, message:'branch not found' });
  const items = await MenuItem.find({ branch: branch._id }).sort({ createdAt:-1 });
  res.json({ ok:true, items });
});

module.exports = router;