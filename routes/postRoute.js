const express = require('express');
const router = express.Router();
const commentRoute = require('./commentRoute');

const filesMiddleware = require('../middleware/filesMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const postController = require('../controller/postController');

const PostModel = require('../model/postModel');

// Nested routes

router.use('/:idPost/comment', commentRoute);

router.post('/removeReact/:id', authMiddleware.protectLogin, postController.removeReact);
router.post('/react/:id', authMiddleware.protectLogin, postController.reactPost);

router.post(
    '/:id/restore',
    authMiddleware.protectLogin,
    authMiddleware.checkOwner(PostModel),
    postController.restorePost,
);
router.delete(
    '/:id/delete',
    authMiddleware.protectLogin,
    authMiddleware.checkOwner(PostModel),
    postController.deletePost,
);
router.delete(
    '/:id/remove',
    authMiddleware.protectLogin,
    authMiddleware.checkOwner(PostModel),
    postController.removePost,
);

router.post(
    '/',
    authMiddleware.protectLogin,
    filesMiddleware.uploadMultiplePhoto('imagePost', 10),
    filesMiddleware.resizePhoto('posts'),
    postController.createPost,
);

router.get('/user/:idUser', postController.findPostOfUser);
router.get('/all', postController.findAllPost);
router.get('/', postController.getNewFeeds);

module.exports = router;
