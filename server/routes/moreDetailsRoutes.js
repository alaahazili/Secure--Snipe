const express = require('express');
const router = express.Router();
const moreDetailsController = require('./../controllers/moreDetailsController');

router.post('/', moreDetailsController.makeApiCall);

module.exports = router;