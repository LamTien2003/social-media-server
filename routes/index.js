const userRoute = require('./userRoute');
const authRoute = require('./authRoute');
const postRoute = require('./postRoute');
const reportRoute = require('./reportRoute');

const route = (app) => {
    app.use('/user', userRoute);
    app.use('/auth', authRoute);
    app.use('/post', postRoute);
    app.use('/report', reportRoute);
};

module.exports = route;
