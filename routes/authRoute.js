const express = require('express');
const router = express.Router();

const filesMiddleware = require('../middleware/filesMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controller/authController');
// find all users
router.post(
    '/signup',
    filesMiddleware.uploadSinglePhoto('photo'),
    filesMiddleware.resizePhoto('users'),
    authController.signup,
);
router.post('/login', authController.login);
router.post('/logout', authMiddleware.protectLogin, authController.logout);
router.get('/refreshToken', authController.refreshToken);

module.exports = router;
