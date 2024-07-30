const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {
    // Be sure to change the title
    app.route('/')
        .get((req, res) => {
        // Change the response to render the Pug template
            res.render('index', {
                title: 'Connected to Database',
                message: 'Please log in',
                showLogin: true,
                showRegistration: true,
                showSocialAuth: true,
                showRegistration: true
            });
        });

    //Made a POST call using the ./login route and redirect to the ./profile view
    app.route('/login')
        .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
            res.redirect('/profile');
        });

    // make a GET call to route ./profile to render the profile view of the app 
    app.route('/profile')
        //ensureAuthenticated is added as a middleware for user authentication
        .get(ensureAuthenticated, (req,res) => { 
            res.render('profile', {
                username: req.user.username //add the usename return from the req to a term of the object
            });

        });

    //unauthenticate the user, and redirect to the home page
    app.route('/logout')
        .get((req, res) => {
            req.logout(); //unauthenticate the user
            res.redirect('/'); 
        });

    /**
    * Add the Register route to the app
    */
    app.route('/register')
        .post((req, res, next) => {
            const hash = bcrypt.hashSync(req.body.password, 12); //Hash the passwords instead
            myDataBase.findOne({ username: req.body.username }, (err, user) => { //Query database with findOne
                // If there is an error, call next with the error
                if(err){
                    next(err)
                }else if (user) { //If a user is returned, redirect back to home
                    res.redirect('/')
                } else { //If a user is not found and no errors occur, then insertOne into the database
                    myDataBase.insertOne({
                        username: req.body.username,
                        password: hash
                    }, (err, doc) => {
                        if (err) {
                            res.redirect('/');
                        } else {
                            // The inserted document is held within
                            // the ops property of the doc
                            next(null, doc.ops[0]);
                        }
                    })
                }
            })
        }, passport.authenticate('local', { failureRedirect: '/' }),
            (req, res, next) => {
                res.redirect('/profile');
            });
            
    app.route('/auth/github')
        .get(passport.authenticate('github'));
    
    app.route('/auth/github/callback')
        .get(passport.authenticate('local', { failureRedirect: '/' }), (req,res) => {
            res.redirect('/profile');
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
}