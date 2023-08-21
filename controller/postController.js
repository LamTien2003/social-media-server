const Post = require('../model/postModel');
const Comment = require('../model/commentModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const { sendResponseToClient } = require('../utils/ultils');
const User = require('../model/userModel');

exports.findAllPost = catchAsync(async (req, res, next) => {
    const posts = await Post.find()
        .populate('comments')
        .populate([
            {
                path: 'likes.user',
                select: 'firstName lastName photo',
            },
            {
                path: 'user',
                select: 'firstName lastName photo ban',
                // match: { ban: { $ne: true } },
            },
        ]);
    // const data = posts.filter((post) => post.user !== null);
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: posts,
    });
});
exports.getNewFeeds = catchAsync(async (req, res, next) => {
    const posts = await Post.find()
        .populate('comments')
        .populate([
            {
                path: 'likes.user',
                select: 'firstName lastName photo',
            },
            {
                path: 'user',
                select: 'firstName lastName photo ban',
                match: { ban: { $ne: true } },
            },
        ])
        .find({ isDelete: { $ne: true } });
    const data = posts.filter((post) => post.user !== null);
    return sendResponseToClient(res, 200, {
        status: 'success',
        data,
    });
});
exports.findPostOfUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.idUser);
    if (!user || user.ban === true) {
        return next(new AppError('Người dùng này hiện không còn tồn tại hoặc đã bị chặn'));
    }
    const post = await Post.find({ user: req.params.idUser })
        .populate('comments')
        .populate([
            {
                path: 'likes.user',
                select: 'firstName lastName photo',
            },
            {
                path: 'user',
                select: 'firstName lastName photo ban',
                match: { ban: { $ne: true } },
            },
        ])
        .find({ isDelete: { $ne: true } });
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: post,
    });
});

exports.reactPost = catchAsync(async (req, res, next) => {
    const { emotion } = req.body;
    if (!emotion) {
        return next(new AppError('Vui lòng chọn cảm xúc để tương tác với bài viết !!!', 400));
    }
    const payload = {
        user: req.user.id,
        emotion,
    };

    const post = await Post.findById(req.params.id);
    if (!post) {
        return next(new AppError('Bài viết này không còn tồn tại !!!', 400));
    }

    // Find return a Reference Variable of the object is founded
    const isLiked = post.likes.find((like) => like.user.toString() === payload.user.toString());
    if (isLiked) {
        if (isLiked.emotion === payload.emotion) {
            post.likes = post.likes.filter((like) => like.user.toString() !== payload.user.toString());
        } else {
            // Change value of this object in post.likes ===> isLiked currently is reference variable
            Object.assign(isLiked, payload);
        }
    } else {
        const newLikes = [...post.likes, payload];
        post.likes = newLikes;
    }

    await post.save();
    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Bày tỏ cảm xúc cho bài viết thành công',
        data: post,
    });
});
exports.removeReact = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return next(new AppError('Bài viết này không còn tồn tại !!!', 400));
    }
    post.likes = post.likes.filter((like) => like.user.toString() !== req.user.id.toString());

    await post.save();
    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Hủy bỏ cảm xúc cho bài viết thành công',
        data: post,
    });
});

exports.createPost = catchAsync(async (req, res, next) => {
    let payload = { ...req.body, user: req.user.id };

    if (req?.files?.filename) {
        payload.imagePost = req.files.filename;
    }

    const post = await Post.create(payload);
    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Tạo bài viết mới thành công',
        data: post,
    });
});

exports.deletePost = catchAsync(async (req, res, next) => {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
        return next(new AppError('This post is nolonger exist', 400));
    }
    await Comment.deleteMany({ postId: req.params.id });

    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Đã xóa vĩnh viễn bài viết',
    });
});
exports.removePost = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return next(new AppError('This post is nolonger exist', 400));
    }

    post.isDelete = true;
    await post.save();

    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Xóa bài viết thành công',
        data: post,
    });
});
exports.restorePost = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return next(new AppError('Bài viết này không còn tồn tại !!!', 400));
    }

    post.isDelete = false;
    await post.save();

    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Khôi phục bài viết thành công',
        data: post,
    });
});
