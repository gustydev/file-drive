const fileController = require('../controllers/fileController');
const express = require('express');
const router = express.Router();

router.post('/file/upload', fileController.fileUpload);

router.get('/file/:id', fileController.fileDetailGet);
router.post('/file/:id/download', fileController.fileDownload);

module.exports = router;