const fileController = require('../controllers/fileController');
const express = require('express');
const router = express.Router();

router.post('/file/upload', fileController.fileUpload);

router.get('/file/:id', fileController.fileDetailGet);

router.post('/file/:id/move', fileController.fileMove);
router.post('/file/:id/delete', fileController.fileDelete);

router.get('/file/:id/share', fileController.fileShareGet);
router.post('/file/:id/share', fileController.fileSharePost);

router.get('/share/file/:id', fileController.displaySharedFile);

module.exports = router;