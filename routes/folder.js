const folderController = require('../controllers/folderController');
const express = require('express');
const router = express.Router();

router.get('/folder/:id', folderController.viewFolderGet);
router.post('/folder/new', folderController.newFolderPost);

module.exports = router;