const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendResponseToClient } = require('../utils/utils');

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
exports.seenNotification = catchAsync(async (req, res, next) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.notificationId, receiver: req.user.id },
        { isSeen: true },
    );
    if (!notification) {
        return next(new AppError('Không tồn tại thông báo này', 400));
    }
    sendResponseToClient(res, 200, {
        status: 'success',
        data: notification,
    });
});
