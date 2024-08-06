const indexController = require('../controllers/indexController');
const express = require('express');
const router = express.Router();

router.get('/', indexController.indexGet);

module.exports = router;
