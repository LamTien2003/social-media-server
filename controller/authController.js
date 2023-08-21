const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const User = require('../model/userModel');
const AppError = require('../utils/appError');

const { sendResponseToClient } = require('../utils/ultils');

const genarateToken = (data, sercetKey, expriredTime) => {
    const token = jwt.sign(data, sercetKey, {
        expiresIn: expriredTime,
    });
    return token;
};

const createAndSendToken = async (user, statusCode, res) => {
    if (user.password) user.password = undefined;

    const accessToken = genarateToken(
        { id: user._id, role: user.role },
        process.env.JWT_ACCESS_KEY,
        process.env.JWT_EXPIRES_IN_ACCESS,
    );
    const refreshToken = genarateToken(
        { id: user._id, role: user.role },
        process.env.JWT_REFRESH_KEY,
        process.env.JWT_EXPIRES_IN_REFRESH,
    );

    await User.findByIdAndUpdate(user.id, { refreshToken });

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        // expires: new Date(Date.now() + 1 * 60 * 1000),
        httpOnly: true,
        sameSite: 'none',
        secure: true,
    };

    //   if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', refreshToken, cookieOptions);
    return sendResponseToClient(res, statusCode, {
        status: 'success',
        data: user,
        accessToken,
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const data = { ...req.body };
    if (req.file && req.file.filename) {
        data.photo = req.file.filename;
    }
    const newUser = await User.create(data);
    createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('Bạn chưa nhập đủ các thông tin !!!'), 400);
    }
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(user.password, password))) {
        return next(new AppError('Tài khoản hoặc mật khẩu không chính xác'), 401);
    }

    createAndSendToken(user, 200, res);
});

exports.refreshToken = catchAsync(async (req, res, next) => {
    const { jwt: token } = req.cookies;

    if (!token) {
        return next(new AppError('Không có token được đính kèm'), 403);
    }
    const tokenDecoded = await promisify(jwt.verify)(token, process.env.JWT_REFRESH_KEY);
    if (!token || !tokenDecoded) {
        return next(new AppError('Token không hợp lệ', 401));
    }

    const user = await User.findOne({ _id: tokenDecoded.id }).select('+refreshToken');

    if (!user) {
        return next(new AppError('Người dùng này hiện không còn tồn tại', 401));
    }
    if (token !== user.refreshToken) {
        return next(new AppError('Token không hợp lệ, có thể người dùng đã được đăng nhập từ thiết bị khác', 401));
    }

    createAndSendToken(user, 200, res);
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
    const { currentPassword, password, passwordConfirm } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.correctPassword(user.password, currentPassword))) {
        return next(new AppError('Mật khẩu sai !!!', 401));
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    createAndSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('Người dùng này hiện không còn tồn tại', 401));
    }
    user.refreshToken = undefined;
    await user.save();

    res.clearCookie('jwt');

    return sendResponseToClient(res, 200, {
        status: 'success',
        message: 'Đăng xuất thành công !!! ',
    });
});
