const express = require('express');
const router = express.Router({ mergeParams: true });

const commentController = require('../controller/commentController');
const authMiddleware = require('../middleware/authMiddleware');
const filesMiddleware = require('../middleware/filesMiddleware');

const CommentModel = require('../model/commentModel');

router.use(authMiddleware.protectLogin);

router.delete('/:id', authMiddleware.checkOwner(CommentModel), commentController.removeComment);
router.post(
    '/',
    filesMiddleware.uploadSinglePhoto('imageComment'),
    filesMiddleware.resizePhoto('comments'),
    commentController.createComment,
);
router.get('/', commentController.getComment);

module.exports = router;
