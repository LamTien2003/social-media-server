const express = require('express');
const router = express.Router();

const filesMiddleware = require('../middleware/filesMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controller/authController');

const passport = require('passport');
// find all users
router.post(
    '/signup',
    filesMiddleware.uploadSinglePhoto('photo'),
    filesMiddleware.resizePhoto('users'),
    authController.signup,
);
router.get(
    '/loginGoogle/callback',
    passport.authenticate('google', {
        // failureMessage: 'Có lỗi xảy ra khi đăng nhập',
        failureRedirect: '/auth',
        // session: true,
    }),
    authController.loginWithGoogle,
);
router.get(
    '/loginGoogle',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        // accessType: 'online',
        // session: false,
        // failureRedirect: '/123',
        // session: true,
    }),
);

router.post('/login', authController.login);
router.post('/logout', authMiddleware.protectLogin, authController.logout);
router.get('/refreshToken', authController.refreshToken);

module.exports = router;
