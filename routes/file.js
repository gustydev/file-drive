const fileController = require('../controllers/fileController');
const express = require('express');
const router = express.Router();

router.post('/upload', fileController.filePost)

module.exports = router;