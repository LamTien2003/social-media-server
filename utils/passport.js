const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/userModel');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Have to fill full domain, not just path like '/auth/...' and have to similar with url in gg console developer
            callbackURL: `${
                process.env.NODE_ENV === 'development' ? process.env.URL_DEVELOPMENT : process.env.URL_PRODUCTION
            }/auth/loginGoogle/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            const { name, given_name, family_name, email, picture } = profile._json;
            const user = await User.findOne({ email });
            if (user) {
                return done(null, user);
            }

            const newUser = await User.create({
                firstName: given_name || ' ',
                lastName: family_name || ' ',
                email,
                photo: picture,
                loginPlatform: 'google',
            });
            done(null, newUser);
        },
    ),
);
passport.serializeUser(async (user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});
