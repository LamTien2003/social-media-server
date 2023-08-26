const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendResponseToClient } = require('../utils/ultils');

const Conversation = require('../model/conversationModel');
const Message = require('../model/messageModel');

exports.getMyConversations = catchAsync(async (req, res, next) => {
    const conversations = await Conversation.find({ members: { $in: req.user.id } }).populate([
        {
            path: 'members',
            select: 'firstName lastName photo',
        },
        {
            path: 'latestMessage',
            populate: {
                path: 'sender',
                select: 'firstName lastName photo',
            },
        },
    ]);
    sendResponseToClient(res, 200, {
        status: 'success',
        data: conversations,
    });
});
exports.getConservation = catchAsync(async (req, res, next) => {
    const conversation = await Conversation.findOne({ _id: req.params.conversationId }).populate([
        {
            path: 'members',
            select: 'firstName lastName photo',
        },

        {
            path: 'latestMessage',
            populate: {
                path: 'sender',
                select: 'firstName lastName photo',
            },
        },
    ]);
    if (!conversation) return next(new AppError('Không tồn tài cuộc trò chuyện', 400));
    if (!conversation.members.some((member) => member.id === req.user.id)) {
        return next(
            new AppError('Cuộc trò chuyện này không bao gồm bạn, bạn không có quyền được lấy dữ liệu này', 400),
        );
    }
    sendResponseToClient(res, 200, {
        status: 'success',
        data: conversation,
    });
});

exports.getMessages = catchAsync(async (req, res, next) => {
    const messages = await Message.find({ conversation: req.params.conversationId })
        .sort({ updatedAt: -1 })
        // .limit(3)
        .populate({ path: 'sender', select: 'firstName lastName photo' });

    sendResponseToClient(res, 200, {
        status: 'success',
        data: messages,
    });
});

exports.postMessage = catchAsync(async (req, res, next) => {
    const messageQuery = await Message.create({
        sender: req.user.id,
        conversation: req.params.conversationId,
        content: req.body.content,
        readBy: [req.user.id],
    });
    const message = await Message.populate(messageQuery, { path: 'sender', select: 'firstName lastName photo' });

    await Conversation.findByIdAndUpdate(req.params.conversationId, { latestMessage: message._id });
    sendResponseToClient(res, 200, {
        status: 'success',
        data: message,
    });
});
exports.readAllMessage = catchAsync(async (req, res, next) => {
    const conversation = await Conversation.findOne({ _id: req.params.conversationId });
    if (!conversation) {
        return next(new AppError('Cuộc trò chuyện không tồn tại', 400));
    }
    const messages = await Message.updateMany(
        { conversation: conversation._id, readBy: { $nin: req.user.id } },
        { $push: { readBy: req.user.id } },
    );
    sendResponseToClient(res, 200, {
        status: 'success',
        data: messages,
    });
});
