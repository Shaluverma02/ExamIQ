const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online_exam_db';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    app.listen(PORT, () => {
      console.log(`Exam Platform API Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err.message);
    console.log('Starting HTTP Server without direct DB connection for initial configuration...');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  });
