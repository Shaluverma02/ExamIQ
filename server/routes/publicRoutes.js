const express = require('express');
const router = express.Router();
const { getOverview } = require('../controllers/publicController');

router.get('/overview', getOverview);

module.exports = router;
