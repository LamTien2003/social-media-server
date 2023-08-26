const userRoute = require('./userRoute');
const authRoute = require('./authRoute');
const postRoute = require('./postRoute');
const reportRoute = require('./reportRoute');
const notificationRoute = require('./notificationRoute');
const conversationRoute = require('./conversationRoute');
const messageRoute = require('./messageRoute');

const route = (app) => {
    app.use('/user', userRoute);
    app.use('/auth', authRoute);
    app.use('/post', postRoute);
    app.use('/report', reportRoute);
    app.use('/notification', notificationRoute);
    app.use('/conversation', conversationRoute);
    app.use('/message', messageRoute);
};

module.exports = route;
