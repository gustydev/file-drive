const indexController = require('../controllers/indexController');
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', indexController.indexGet);

router.get('/signup', indexController.signupGet);

router.post('/signup', indexController.signupPost);

module.exports = router;
