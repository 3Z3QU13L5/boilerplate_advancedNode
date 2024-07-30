const passport = require('passport');
const LocalStrategy = require('passport-local');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');
const GitHubStrategy = require('passport-github').Strategy;

module.exports = function (app, myDataBase) {
    // Serialization and deserialization here...
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });
    
    passport.deserializeUser((id, done) => {
        myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
            if (err) return console.error(err);
            done(null, doc);
        });
    });    
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://3000-freecodecam-boilerplate-vkrssql0kbw.ws-us115.gitpod.io/auth/github/callback"
      },
        function(accessToken, refreshToken, profile, cb) {
            console.log(profile);
            //Database logic here with callback containing your user object
            myDataBase.findOneAndUpdate({ id: profile.id }, {
                $setOnInsert: {
                    id: profile.id,
                    username: profile.username,
                    name: profile.displayName || 'John Doe',
                    photo: profile.photos[0].value || '',
                    email: Array.isArray(profile.emails)
                    ? profile.emails[0].value
                    : 'No public email',
                    created_on: new Date(),
                    provider: profile.provider || ''
                },
                $set: {
                    last_login: new Date()
                },
                $inc: {
                    login_count: 1
                }
            },
                { upsert: true, new: true },
                    (err, doc) => {
                        return cb(null, doc.value);
                    }
            );
        }
      ));
    /* 
    A strategy is a way of authenticating a user. 
    You can use a strategy for allowing users to authenticate based on locally saved information 
    */
    passport.use(new LocalStrategy((username, password, done) => {
        myDataBase.findOne({ username: username }, (err, user) => {
            console.log(`User ${username} attempted to log in.`);
            if (err) {return done(err);}
            if (!user) {return done(null, false);}
            if (!bcrypt.compareSync(password, user.password)){
                return done(null, false); //check the password entered against the hash
            }
            return done(null, user);
        });
    }));
}