'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes.js');
const auth = require('./auth.js')
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

  routes(app, myDataBase);
  auth(app, myDataBase)

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

  // Be sure to add this... catch the error on the promises and display it on the app
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
