const express = require('express');
const router = express.Router({ mergeParams: true });

const authMiddleware = require('../middleware/authMiddleware');
const chatController = require('../controller/chatController');

router.use(authMiddleware.protectLogin);

router.get('/:conversationId', chatController.getConservation);
router.get('/', chatController.getMyConversations);

module.exports = router;
