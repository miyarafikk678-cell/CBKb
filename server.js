require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const Branch = require('./models/Branch');
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cheesy-multi';
const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'Chessy$2023';

async function start(){
  await mongoose.connect(MONGODB_URI);

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  app.use(cors());
  app.use(express.json());

  // attach io
  app.set('io', io);

  // routes
  app.use('/api/auth', authRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', ordersRoutes);

  // basic health
  app.get('/health', (req,res)=> res.json({ ok:true }));

  // socket: allow admin clients to join branch room and user clients too
  io.on('connection', (socket) => {
    socket.on('joinBranch', (payload) => {
      // payload: { branchId }
      if(payload && payload.branchId) socket.join(String(payload.branchId));
    });
  });

  // seed on startup: create branches and admins if not exist
  const branches = [
    { name:'Cheesy', slug:'cheesy', adminEmail:'cheesyadmin@gmail.com' },
    { name:'Koub Karak', slug:'koub', adminEmail:'koubadmin@gmail.com' },
    { name:'Burrata', slug:'burrata', adminEmail:'burrataadmin@gmail.com' }
  ];
  const bcrypt = require('bcrypt');
  for(const b of branches){
    let branch = await Branch.findOne({ slug: b.slug });
    if(!branch) branch = await Branch.create({ name: b.name, slug: b.slug });
    let admin = await User.findOne({ email: b.adminEmail });
    if(!admin){
      const hash = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10);
      admin = await User.create({ email: b.adminEmail, name: b.name + ' Admin', passwordHash: hash, role:'admin', branch: branch._id });
      console.log('Created admin:', b.adminEmail);
    } else {
      console.log('Admin exists:', b.adminEmail);
    }
  }

  server.listen(PORT, ()=> console.log('Server listening on', PORT));
}

start().catch(err => {
  console.error('startup failed', err);
  process.exit(1);
});