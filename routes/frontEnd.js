
/*
 * Browser routing, for clients
 */
var fs = require('fs')
    , config = JSON.parse(fs.readFileSync('./config.json'))
    , passport = require('passport')
    , moment = require('moment')
    , User = require('../models/user')
    , Bench = require('../models/bench');

module.exports = function (app, ensureAuth, io) {
  app.get('/', function(req, res) {
    if (req.user) {
      if (req.user.dribbble) {
        Bench.find({userId: req.user._id}).lean().exec(function(err, benches) {
          if (benches.length > 0) {
            res.render('index', { title: config.name,
                              user: req.user,
                              isHome: true,
                              req: req,
                              benches: benches,
                              message: req.flash('message'), 
                              error: req.flash('error') });
          } else {
            req.flash('error', 'You should create your first bbbench!');
            res.redirect('/new-bench');
          }
        });
      } else {
        req.flash('error', 'You should fill in a dribbble username.');
        res.redirect('/settings');
      }
    } else {
      res.render('index', { title: config.name,
                            user: req.user,
                            req: req,
                            message: req.flash('message'), 
                            error: req.flash('error') });
    }
  });

  app.get('/new-bench', ensureAuth, function(req, res) {
    res.render('benchForm', { title: 'Make a new bench!',
                          user: req.user,
                          bench: {},
                          type: 'new',
                          req: req,
                          message: req.flash('message'), 
                          error: req.flash('error') });
  });
  app.post('/new-bench', ensureAuth, function(req, res) {
    var data = req.body;
    data.uid = req.user._id;
    Bench.newBench(data, io, function(err, bench){
      if (err) {
        req.flash('error', 'There was a problem building your bench: '+err);
        res.redirect('/new-bench');
        console.log(err);
      }
      req.flash('message', 'Bench built!');
      res.redirect('/');
    });
  });
  app.get('/bench/:id', function(req, res) {
    Bench.findById(req.params.id, function(err, bench) {
      if(err) {
        req.flash('error', 'There was a problem finding your bench: '+err);
        res.redirect('/');
        console.log(err);
      }
      if(bench){
        User.findById(bench.userId).lean().exec(function(err, owner){
          if(err) {
            req.flash('error', 'There was a problem finding your bench: '+err);
            res.redirect('/');
            console.log(err);
          }
          res.render('bench', { title: bench.title,
                              user: req.user,
                              owner: owner,
                              bench: bench,
                              req: req,
                              message: req.flash('message'), 
                              error: req.flash('error') });
        })
      } else {
        res.render('404', { url: req.url, title: '404 - No bench found' });
      }
    });
  });
  app.get('/bench/:id/edit', ensureAuth, function(req, res) {
    Bench.findById(req.params.id, function(err, bench) {
      if(err) {
        req.flash('error', 'There was a problem finding your bench: '+err);
        res.redirect('/');
        console.log(err);
      }
      if(bench && bench.userId == req.user._id){
        res.render('benchForm', { title: 'Editing '+bench.title,
                                  user: req.user,
                                  bench: bench,
                                  type: 'edit',
                                  req: req,
                                  message: req.flash('message'), 
                                  error: req.flash('error') });
      } else {
        req.flash('error', 'You are not allowed to edit other players\' benches!');
        res.redirect('/bench/' + req.params.id);
      }
    });
  });
  app.post('/bench/:id/edit', ensureAuth, function(req, res) {
    Bench.updateBench(req.params.id, req.body, req.user._id, io, function(err, bench){
      if(err == 403){
        req.flash('error', 'You are not allowed to edit other players\' benches!');
        res.redirect('/bench/' + req.params.id);
      } else if(err){
        req.flash('error', 'There was a problem fixing your bench: '+err);
        res.redirect('/bench/' + req.params.id);
        console.log(err);
      } else {
        req.flash('message', 'All good!');
        res.redirect('/bench/' + req.params.id);
      }
    });
  });

  app.get('/settings', ensureAuth, function(req, res) {
    res.render('settings', { title: 'Your settings', 
                            user: req.user, 
                            req: req,
                            message: req.flash('message'), 
                            error: req.flash('error') });
  });
  app.post('/settings', ensureAuth, function(req, res) {
    if (req.body.password && (req.body.password != req.body.password_conf)) {
      req.flash('error', 'New password and password confirmation must match.')
      res.redirect('/settings');
    } else if(!req.body.username || !req.body.email){
      req.flash('error', 'Please supply a username and email.')
      res.redirect('/settings');
    } else if(!req.body.dribbble){
      req.flash('error', 'Please supply a dribbble username.')
      res.redirect('/settings');
    } else {
      User.findById(req.user._id, function(err,user){
        if(err){
          req.flash('error', 'Updates were unsuccessful: '+err);
          res.redirect('/settings');
        }
        if(req.body.password){
          user.setPassword(req.body.password, function setPassword(err, resetAccount){
            if(err) {
              req.flash('error', 'There was a problem in saving that information: '+err);
              res.redirect('/settings');
              throw err;
            }
            resetAccount.username = req.body.username;
            resetAccount.dribbble = req.body.dribbble;
            resetAccount.email = req.body.email;
            if(req.body.getUpdates){resetAccount.getUpdates = true;}else{resetAccount.getUpdates = false;};
            resetAccount.save(function(err, saved){
              if(err) {
                req.flash('error', 'There was a problem in saving that information: '+err);
                res.redirect('/settings');
                throw err;
              }
              req.flash('message', 'Updates were successful.');
              res.redirect('/settings');
            });
          });
        } else {
          user.username = req.body.username;
          user.dribbble = req.body.dribbble;
          user.email = req.body.email;
          if(req.body.getUpdates){user.getUpdates = true;}else{user.getUpdates = false;};
          user.save(function(err, saved){
            if(err) {
              req.flash('error', 'There was a problem in saving that information: '+err);
              res.redirect('/settings');
              throw err;
            }
            req.flash('message', 'Updates were successful.');
            res.redirect('/settings');
          });
        }
      });
    }
  });

  app.get('/register', function(req, res) {
    res.render('signIn', { title: 'Register for '+config.name, 
                          type: 'register',
                          user: req.user, 
                          req: req,
                          message: req.flash('message'), 
                          error: req.flash('error') });
  });
  app.post('/register', function(req, res) {
    if (req.body.password != req.body.password_conf) {
      req.flash('error', 'Password and password confirmation must match.');
      res.redirect('/');
    }
    User.register(new User({ email : req.body.email, username: req.body.email.match(/^[^@]*/) }), req.body.password, function(err, account) {
        if (err) {
            req.flash('error', 'That email is already in use.');
            return res.redirect('/');
        }
        passport.authenticate('local')(req, res, function () {
          req.flash('message', 'Welcome, '+account.username+'!');
          res.redirect('/settings');
        });
    });
  });
  app.get('/sign-in', function(req, res) {
    res.render('signIn', { title: 'Sign In to ' + config.name, 
                            user: req.user, 
                            type: 'signin',
                            req: req,
                            message: req.flash('message'), 
                            error: req.flash('error') });
  });
  app.post('/sign-in', passport.authenticate('local', { failureRedirect: '/sign-in', failureFlash: 'Invalid email or password.' }), function(req, res) {
    res.redirect('/');
  });
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/sign-in', failureFlash: 'Something is whack with your Twitter account!' }), function(req, res) {
    req.flash('message', 'Connected via Twitter!');
    res.redirect('/settings');
  });
  app.get('/sign-out', function(req, res) {
    req.logout();
    req.flash('message', 'You have been signed out.');
    res.redirect('/');
  });
};