const express = require('express');
const router = express.Router({ mergeParams: true });

const reportController = require('../controller/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const filesMiddleware = require('../middleware/filesMiddleware');

const CommentModel = require('../model/commentModel');

router.use(authMiddleware.protectLogin);

// router.delete('/:id', authMiddleware.checkOwner(CommentModel), commentController.removeComment);
router.post('/:idPost', reportController.createReport);
router.get('/user/:idUser', reportController.getReportsOfUser);
router.get('/', reportController.getReports);

module.exports = router;
