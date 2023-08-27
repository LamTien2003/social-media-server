const express = require('express');
const router = express.Router({ mergeParams: true });

const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controller/notificationController');

router.use(authMiddleware.protectLogin);

router.patch('/seen/:notificationId', notificationController.seenNotification);
router.get('/', notificationController.getMyNotifications);

module.exports = router;
