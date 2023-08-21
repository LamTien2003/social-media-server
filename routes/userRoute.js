const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const filesMiddleware = require('../middleware/filesMiddleware');
const userController = require('../controller/userController');
const authController = require('../controller/authController');

// find all users
const router = express.Router();

router.use(authMiddleware.protectLogin);
router.post('/unban/:idUser', authMiddleware.restrictTo('admin'), userController.unbanUser);
router.post('/ban/:idUser', authMiddleware.restrictTo('admin'), userController.banUser);

router.delete('/friendRequest/:idUser', userController.cancelFriend);
router.post('/friendRequest/:idUser', userController.acceptFriend);
router.delete('/friend/:idUser', userController.removeFriend);
router.post('/friend/:idUser', userController.addFriend);

router.patch(
    '/changeMe',
    filesMiddleware.uploadMultipleFields([
        { name: 'photo', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
    ]),

    filesMiddleware.resizePhoto('users'),
    userController.changeMe,
);
router.patch('/updateMyPassword', authController.updateMyPassword);
router.get('/suggestFriends', userController.getSuggestFriends);
router.get('/getMe', userController.getMe);
router.get('/:idUser', userController.getUser);
router.get('/', userController.getAllUser);

module.exports = router;
