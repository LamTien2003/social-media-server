const express = require('express');
const router = express.Router({ mergeParams: true });

const authMiddleware = require('../middleware/authMiddleware');
const chatController = require('../controller/chatController');

router.use(authMiddleware.protectLogin);

router.patch('/readAll/:conversationId', chatController.readAllMessage);
router.post('/:conversationId', chatController.postMessage);
router.get('/:conversationId', chatController.getMessages);

module.exports = router;
