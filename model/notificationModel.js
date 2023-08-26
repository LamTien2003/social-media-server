const mongoose = require('mongoose');

const NotificationSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        },
        receiver: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        },
        content: {
            type: String,
            maxlength: [100, 'Nội dung thông báo không được vượt quá 100 kí tự'],
        },
        type: {
            type: String,
            enum: ['reaction', 'friend'],
        },
        isSeen: {
            type: Boolean,
            default: false,
        },
        entityId: mongoose.Schema.ObjectId,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
