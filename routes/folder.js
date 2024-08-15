const folderController = require('../controllers/folderController');
const express = require('express');
const router = express.Router();

router.get('/folder/:id', folderController.viewFolderGet);
router.post('/folder/new', folderController.newFolderPost);

router.get('/folder/:id/delete', folderController.deleteFolderGet);
router.post('/folder/:id/delete', folderController.deleteFolderPost)

router.get('/folder/:id/share', folderController.folderShareGet);
router.post('/folder/:id/share', folderController.folderSharePost);

router.get('/share/folder/:id', folderController.displaySharedFolder);

module.exports = router;