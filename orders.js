const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Branch = require('../models/Branch');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ ok:false });
  const token = auth.split(' ')[1];
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch(e){ return res.status(401).json({ ok:false }); }
}

// create order (user)
router.post('/', authMiddleware, async (req, res) => {
  // expects: { items: [{ name, qty, price }], branch: 'cheesy' } and token user is logged
  const { items, branch } = req.body;
  if(!items || !items.length || !branch) return res.status(400).json({ ok:false });
  const branchDoc = await Branch.findOne({ slug: branch });
  if(!branchDoc) return res.status(404).json({ ok:false, message:'branch not found' });
  const user = await User.findOne({ email: req.user.email });
  if(!user) return res.status(404).json({ ok:false, message:'user not found' });
  const order = await Order.create({ user: user._id, branch: branchDoc._id, items });
  // emit socket event to branch room
  if(req.app.get('io')) req.app.get('io').to(String(branchDoc._id)).emit('orderCreated', { orderId: order._id, branch: branchDoc.slug });
  res.json({ ok:true, order });
});

// list orders for admin by branch (admin token)
router.get('/branch/:branchSlug', async (req, res) => {
  const branch = await Branch.findOne({ slug: req.params.branchSlug });
  if(!branch) return res.status(404).json({ ok:false });
  const orders = await Order.find({ branch: branch._id }).populate('user','email name').sort({ createdAt:-1 });
  res.json({ ok:true, orders });
});

// user list their orders
router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  if(!user) return res.status(404).json({ ok:false });
  const orders = await Order.find({ user: user._id }).populate('branch','slug name').sort({ createdAt:-1 });
  res.json({ ok:true, orders });
});

// update order status (admin or user marking as received)
router.put('/:id/status', authMiddleware, async (req,res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id).populate('branch');
  if(!order) return res.status(404).json({ ok:false });
  const user = await User.findOne({ email: req.user.email });
  // if user is admin for order.branch or same user then allowed
  const isAdmin = req.user.role === 'admin' && req.user.branch === order.branch.slug;
  const isOwner = user && String(order.user) === String(user._id);
  if(!isAdmin && !isOwner) return res.status(403).json({ ok:false });
  order.status = status;
  await order.save();
  // emit sockets
  if(req.app.get('io')) req.app.get('io').to(String(order.branch._id)).emit('orderUpdated', { orderId: order._id, status });
  res.json({ ok:true, order });
});

module.exports = router;