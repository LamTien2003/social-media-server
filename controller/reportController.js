const Report = require('../model/reportModel');
const Post = require('../model/postModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendResponseToClient } = require('../utils/utils');

exports.createReport = catchAsync(async (req, res, next) => {
    const payload = {
        user: req.user.id,
        post: req.params.idPost,
        reason: req.body.reason,
    };

    const post = await Post.findById(req.params.idPost);
    if (!post) {
        return next(new AppError('Bài viết này không còn tồn tại !!!'));
    }
    payload.userPost = post.user;
    const report = await Report.create(payload);
    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Đã gửi thư báo cáo cho đội ngũ quản lý',
        data: report,
    });
});

exports.getReports = catchAsync(async (req, res, next) => {
    const reports = await Report.find({})
        .populate({
            path: 'user',
            select: 'firstName lastName photo',
        })
        .populate({
            path: 'post',
            populate: [
                { path: 'comments' },
                {
                    path: 'user',
                    select: 'firstName lastName photo ban',
                },
                {
                    path: 'likes.user',
                    select: 'firstName lastName photo',
                },
            ],
        });
    if (!reports) {
        return next(new AppError('There is not any comment here'));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: reports,
    });
});
exports.getReportsOfUser = catchAsync(async (req, res, next) => {
    const reports = await Report.find({ user: req.params.idUser });
    if (!reports) {
        return next(new AppError('There is not any comment here'));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: reports,
    });
});
