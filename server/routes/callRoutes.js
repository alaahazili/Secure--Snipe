const express = require('express');
const router = express.Router();
const callController = require('./../controllers/callController');

router.get('/', callController.makeApiCall);

module.exports = router;