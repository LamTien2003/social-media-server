const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendResponseToClient } = require('../utils/ultils');

const Notification = require('../model/notificationModel');

exports.getMyNotifications = catchAsync(async (req, res, next) => {
    const notifications = await Notification.find({ receiver: req.user.id }).populate([
        {
            path: 'sender',
            select: 'firstName lastName photo',
        },
    ]);
    sendResponseToClient(res, 200, {
        status: 'success',
        data: notifications,
    });
});
