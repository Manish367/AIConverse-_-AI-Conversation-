const express = require('express');
const { listModels } = require('../controllers/modelController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/models
router.get('/', auth, listModels);

module.exports = router;
