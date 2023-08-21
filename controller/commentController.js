const Comment = require('../model/commentModel');
const Post = require('../model/postModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendResponseToClient } = require('../utils/ultils');

exports.createComment = catchAsync(async (req, res, next) => {
    const payload = {
        user: req.user.id,
        postId: req.params.idPost,
        comment: req.body.comment,
    };
    if (req?.file?.filename) {
        payload.imageComment = req.file.filename;
    }

    const post = await Post.findById(req.params.idPost);
    if (!post) {
        return next(new AppError('Bài viết này không còn tồn tại !!!'));
    }

    const comment = await Comment.create(payload);
    await comment.populate({
        path: 'user',
        select: 'firstName lastName photo',
    });
    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Create a new comment successfully',
        data: comment,
    });
});

exports.removeComment = catchAsync(async (req, res, next) => {
    await Comment.findByIdAndDelete(req.params.id);
    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Xóa bình luận thành công',
    });
});

exports.getComment = catchAsync(async (req, res, next) => {
    const comments = await Comment.find({ postId: req.params.idPost });
    if (!comments) {
        return next(new AppError('There is not any comment here'));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: comments,
    });
});
