const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const route = require('./routes/index');

const socketIo = require('./socket');
const passport = require('passport');

// Environment Variable Config
dotenv.config({ path: './config.env' });

// Connect to Database
const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        // useCreateIndex: true,
        // useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then(() => console.log('DB connection successful!'))
    .catch(() => console.log('Fail to connect with Database !!!'));

const app = express();

// Config Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Limit requests from same IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use(morgan('dev'));

// Limit IP is accepted to API -> It is enabling all request http
// Credentials to enable to set cookie for client, orign is domain which accepted for, origin can be string or array string or true for all domains
app.use(
    cors({
        credentials: true,
        origin: ['http://127.0.0.1:5173', 'https://socialmedia-lamthanhtien.netlify.app'],
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    }),
);

// Set security HTTP headers
// [FIXBUG] Have to setting crossOriginOpenerPolicy for check if oauth2 tab is closed in Client, for somereason if not set, property closed of newTabWindow always set to true
app.use(helmet({ crossOriginEmbedderPolicy: false, crossOriginOpenerPolicy: { policy: 'unsafe-none' } }));

// Body parser, reading data from body into req.body
app.use(bodyParser.json({ limit: '30mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '30mb' }));

// CookirParse have to always init before session-expreess
app.use(cookieParser());
app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        // If enable cookie sucure, it only accepted https request
        // cookie: { secure: true },
    }),
);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution (Avoid duplicate data from parameter)
app.use(
    hpp({
        whitelist: [],
    }),
);

// Config middleware for Passport Login
require('./utils/passport');
app.use(passport.initialize());
// Have to add session for get info from gg to this server express, Have to install express-session with this
app.use(passport.session());

// Routes
route(app);
// Handle unfound Route
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Middleware handle Error
app.use(globalErrorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

// Config Socket
const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: '*',
        // origin: 'https://lamthanhtien-socialmedia.netlify.app',
        methods: ['GET', 'POST'],
        // allowedHeaders: ['my-custom-header'],
        credentials: true,
    },
    // Fix bug when deploy
    transport: 'polling',
});

socketIo(io);
