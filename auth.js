const passport = require('passport');
const LocalStrategy = require('passport-local');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');

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