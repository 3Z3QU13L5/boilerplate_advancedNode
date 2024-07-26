'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const app = express();



fccTesting(app); //For FCC testing purposes

app.set('view engine', 'pug');
app.set('views', './views/pug')

app.use(session({
  secret: process.env.SESSION_SECRET, //is used to compute the hash used to encrypt your cookie!
  resave: true, //middleware saves the session id as a cookie in the client
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(passport.initialize())
app.use(passport.session())

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  // Be sure to change the title
  app.route('/').get((req, res) => {
    // Change the response to render the Pug template
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true
    });
  });

  //Made a POST call using the ./login route and redirect to the ./profile view
  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  })

  // make a GET call to route ./profile to render the profile view of the app 
  app
  .route('/profile')
  //ensureAuthenticated is added as a middleware for user authentication
  .get(ensureAuthenticated, (req,res) => { 
    res.render('profile', {
      username: req.user.username //add the usename return from the req to a term of the object
    });
    
 })

//unauthenticate the user, and redirect to the home page
 app.route('/logout')
  .get((req, res) => {
    req.logout(); //unauthenticate the user
    res.redirect('/'); 
});
/**
 * handling missing pages (404). 
 * The common way to handle this in Node 
 * is with the adding the following middleware.
 */
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});
/* 
A strategy is a way of authenticating a user. 
You can use a strategy for allowing users to authenticate based on locally saved information 
*/
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      if (password !== user.password) return done(null, false);
      return done(null, user);
    });
  }));

  // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });
  

  // Be sure to add this... catch the error on the promises and display it on the app
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

/**
 * middlewre that Authenticate the user before the allowing the log in
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
