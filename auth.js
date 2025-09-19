const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Branch = require('../models/Branch');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// user login (email/password)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok:false, message:'email+password required' });
  const user = await User.findOne({ email }).populate('branch', 'slug name');
  if(!user) return res.status(401).json({ ok:false, message:'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash || '');
  if(!ok) return res.status(401).json({ ok:false, message:'Invalid credentials' });
  const token = jwt.sign({ uid: user._id, role: user.role, email: user.email, branch: user.branch ? user.branch.slug : null }, JWT_SECRET, { expiresIn:'12h' });
  res.json({ ok:true, token, user: { id: user._id, email: user.email, role: user.role, branch: user.branch } });
});

// seed route to create branches and admin users (protected in production by env check)
router.post('/seed', async (req, res) => {
  // only allow from local or if env var allows
  const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'Chessy$2023';
  const branches = [
    { name:'Cheesy', slug:'cheesy', adminEmail: 'cheesyadmin@gmail.com' },
    { name:'Koub Karak', slug:'koub', adminEmail: 'koubadmin@gmail.com' },
    { name:'Burrata', slug:'burrata', adminEmail: 'burrataadmin@gmail.com' }
  ];

  const created = { branches:[], admins:[] };
  for(const b of branches){
    let branch = await Branch.findOne({ slug: b.slug });
    if(!branch) branch = await Branch.create({ name: b.name, slug: b.slug });
    created.branches.push(branch);

    let admin = await User.findOne({ email: b.adminEmail });
    if(!admin){
      const hash = await bcrypt.hash(defaultPass, 10);
      admin = await User.create({ email: b.adminEmail, name: b.name + ' Admin', passwordHash: hash, role:'admin', branch: branch._id });
      created.admins.push({ email: b.adminEmail });
    }
  }
  res.json({ ok:true, created });
});

module.exports = router;