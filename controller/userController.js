const catchAsync = require('../utils/catchAsync');
const User = require('../model/userModel');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const { sendResponseToClient } = require('../utils/ultils');

const findUserByIdAndPopulate = async (query) => {
    const users = await User.find(query)
        .populate([
            {
                path: 'waitting',
                select: 'firstName lastName photo friends',
                match: { ban: { $ne: true } },
            },
            {
                path: 'friends',
                select: 'firstName lastName photo friends',
                match: { ban: { $ne: true } },
            },
            {
                path: 'pending',
                select: 'firstName lastName photo friends',
                match: { ban: { $ne: true } },
            },
        ])
        .find({ ban: { $ne: true } });

    const finalData = users.map((user) => {
        const userObject = user.toObject();
        userObject.pending = userObject.pending.map((item) => {
            const commonFriends = item.friends.filter((friendId) => {
                const friendCommon = userObject.friends.find((friend) => friend.id.toString() === friendId.toString());
                if (friendCommon) {
                    return friendCommon;
                }
            }).length;
            return {
                ...item,
                commonFriends,
                friends: undefined,
            };
        });
        userObject.waitting = userObject.waitting.map((item) => {
            const commonFriends = item.friends.filter((friendId) => {
                const friendCommon = userObject.friends.find((friend) => friend.id.toString() === friendId.toString());
                if (friendCommon) {
                    return friendCommon;
                }
            }).length;
            return {
                ...item,
                commonFriends,
                friends: undefined,
            };
        });
        userObject.friends = userObject.friends.map((item) => {
            const commonFriends = item.friends.filter((friendId) => {
                const friendCommon = userObject.friends.find((friend) => friend.id.toString() === friendId.toString());
                if (friendCommon) {
                    return friendCommon;
                }
            }).length;
            return {
                ...item,
                commonFriends,
                friends: undefined,
            };
        });
        return userObject;
    });

    return finalData;
};
exports.getSuggestFriends = catchAsync(async (req, res, next) => {
    const fillter = {
        _id: { $nin: [...req.user.friends, ...req.user.pending, ...req.user.waitting], $ne: req.user._id },
        ban: { $ne: true },
    };
    const query = new APIFeatures(User.find(fillter).select('firstName lastName photo friends'), req.query).limit();

    const suggestUsers = await query.query;
    const arraySuggest = Array.from(suggestUsers);

    const data = arraySuggest.map((user) => {
        // Change to normal object instead of document object of mongoose
        const userObject = user.toObject();
        userObject.commonFriends = userObject.friends.filter((friend) => req.user.friends.includes(friend)).length;
        userObject.friends = undefined;
        return userObject;
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: data,
    });
});

exports.getAllUser = catchAsync(async (req, res, next) => {
    const users = await User.find({});
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: users,
    });
});

exports.getUser = catchAsync(async (req, res, next) => {
    const userQuery = await findUserByIdAndPopulate({ _id: req.params.idUser });
    const user = userQuery[0];
    if (!user) {
        return next(new AppError('Người dùng không còn tồn tại hoặc đã bị chặn !!!', 400));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: user,
    });
});

exports.getMe = catchAsync(async (req, res, next) => {
    const userQuery = await findUserByIdAndPopulate({ _id: req.user.id });
    // Change user Query to Object for add some fields before sending response
    const user = userQuery[0];
    if (!user) {
        return next(new AppError('Người dùng không còn tồn tại hoặc đã bị chặn !!!', 400));
    }

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: user,
    });
});

exports.changeMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'Đường dẫn này không dùng để thay đổi mật khẩu. Vui lòng dùng /updateMyPassword để thay thế',
                400,
            ),
        );
    }

    const { firstName, lastName, location, occupation, introduce } = req.body;
    let changeInfo = {
        firstName,
        lastName,
        location,
        occupation,
        introduce,
    };

    if (req?.files?.filename?.photo) {
        changeInfo.photo = req.files.filename.photo[0];
    }
    if (req?.files?.filename?.coverImage) {
        changeInfo.coverImage = req.files.filename.coverImage[0];
    }
    // console.log(changeInfo);
    const user = await User.findByIdAndUpdate(req.user.id, changeInfo, {
        new: true,
        runValidators: true,
    });
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: user,
    });
});

exports.addFriend = catchAsync(async (req, res, next) => {
    if (req.params.idUser === req.user.id) {
        return next(new AppError('Bạn không thể kết bạn với chính mình'));
    }

    const user = await User.findById(req.params.idUser);
    const currentUser = await User.findById(req.user.id);

    if (currentUser.waitting.includes(user._id)) {
        return next(new AppError('Bạn đã gửi yêu cầu kết bạn cho người dùng này rồi', 403));
    }
    if (currentUser.pending.includes(user._id)) {
        return next(
            new AppError(
                'Bạn đã nhận được yêu cầu kết bạn từ người dùng này trước đây. Vui lòng dùng /acceptFriend để chấp nhận hoặc /cancelFriend để từ chối yêu cầu',
            ),
        );
    }
    if (currentUser.friends.includes(user._id)) {
        return next(new AppError('Bạn đã là bạn của người dùng này rồi'));
    }

    await user.updateOne({ $push: { pending: currentUser._id } });
    await currentUser.updateOne({ $push: { waitting: user._id } });

    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Gửi yêu cầu kết bạn thành công',
    });
});

exports.acceptFriend = catchAsync(async (req, res, next) => {
    if (req.params.idUser === req.user.id) {
        return next(new AppError('Bạn không thể kết bạn với chính mình'));
    }
    const user = await User.findById(req.params.idUser);
    const currentUser = await User.findById(req.user.id);

    if (currentUser.waitting.includes(user._id)) {
        return next(
            new AppError(
                'Bạn đã gửi yêu cầu kết bạn cho người dùng này rồi. Vui lòng chờ phản hồi từ người dùng này ',
                403,
            ),
        );
    }
    if (currentUser.friends.includes(user._id)) {
        return next(new AppError('Bạn đã là bạn của người dùng này rồi', 403));
    }
    if (!currentUser.pending.includes(user.id)) {
        return next(new AppError('Có vẻ như bạn chưa nhận được yêu cầu kết bạn nào từ người dùng này', 403));
    }

    await user.updateOne({ $push: { friends: currentUser._id }, $pull: { waitting: currentUser._id } });
    await currentUser.updateOne({ $push: { friends: user._id }, $pull: { pending: user._id } });

    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Chấp nhận yêu cầu kết bạn thành công',
    });
});

exports.cancelFriend = catchAsync(async (req, res, next) => {
    if (req.params.idUser === req.user.id) {
        return next(new AppError('Bạn không thể kết bạn với chính mình'));
    }

    const user = await User.findById(req.params.idUser);
    const currentUser = await User.findById(req.user.id);

    if (currentUser.friends.includes(user._id)) {
        return next(
            new AppError(
                'Bạn đã là bạn của người dùng này rồi. Nếu bạn muốn hủy kết bạn, hãy dùng /removeFriend để thay thế',
                403,
            ),
        );
    }
    if (currentUser.waitting.includes(user._id)) {
        await user.updateOne({ $pull: { pending: currentUser._id } });
        await currentUser.updateOne({ $pull: { waitting: user._id } });

        return res.status(200).json({
            status: 'success',
            message: 'Hủy bỏ yêu cầu kết bạn thành công',
        });
    }
    if (!currentUser.pending.includes(user.id)) {
        return next(new AppError('Có vẻ như bạn chưa nhận được yêu cầu kết bạn nào từ người dùng này', 403));
    }

    await user.updateOne({ $pull: { waitting: currentUser._id } });
    await currentUser.updateOne({ $pull: { pending: user._id } });

    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Hủy bỏ yêu cầu kết bạn thành công',
    });
});

exports.removeFriend = catchAsync(async (req, res, next) => {
    if (req.params.idUser === req.user.id) {
        return next(new AppError('Bạn không thể xóa kết bạn với chính mình'));
    }

    const user = await User.findById(req.params.idUser);
    const currentUser = await User.findById(req.user.id);

    if (currentUser.waitting.includes(user._id)) {
        return next(
            new AppError(
                'Có vẻ như bạn đã gửi cho người dùng này lời mời kết bạn. Để hủy lời mời, hãy sử dụng /cancelFriend để thay thế ',
                403,
            ),
        );
    }
    if (currentUser.pending.includes(user.id)) {
        return next(
            new AppError(
                'Có vẻ như bạn đã nhận được lời mời kết bạn từ người dùng này. Để hủy bỏ lời mời này, hãy sử dụng /cancelFriend để thay thế',
                403,
            ),
        );
    }
    if (!currentUser.friends.includes(user._id)) {
        return next(new AppError('Bạn và người dùng này không là bạn bè để thực hiện hủy kết bạn', 403));
    }

    await user.updateOne({ $pull: { friends: currentUser._id } });
    await currentUser.updateOne({ $pull: { friends: user._id } });

    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Hủy bỏ yêu cầu kết bạn thành công',
    });
});

exports.unbanUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.idUser, { ban: false });
    if (!user) {
        return next(new AppError('Người dùng hiện không tồn tại hoặc đã bị chặn', 400));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Gỡ chặn người dùng thành công',
    });
});
exports.banUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.idUser, { ban: true });
    if (!user) {
        return next(new AppError('Người dùng hiện không tồn tại hoặc đã bị chặn', 400));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Chặn người dùng thành công',
    });
});
