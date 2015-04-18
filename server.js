'use strict';

var express = require('express');
var app = express();

var session  = require('express-session');

var bodyParser = require('body-parser');
var multer  = require('multer');
var cookieParser = require('cookie-parser');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var mongoose = require('mongoose');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

app.use(session({ 
    secret: 'datenuts',
    resave: false,
    saveUninitialized: true 
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/public'));

mongoose.connect('mongodb://localhost/cyclecircle');

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    following: [String],
    savedRides: [String]
});

var User = mongoose.model('User', UserSchema);

passport.use(new LocalStrategy(
function (username, password, done) {
    User.findOne({username: username, password: password}, function (err,docs) {
        if (err) {
            return done(null, false, {errorMessage: 'Username or password is invalid'});
        } else {
            return done(null, docs);
        }
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

var auth = function (req, res, next) {
    if (!req.isAuthenticated())
        res.send(401);
    else
        next();
};

app.get('/users', auth, function (req, res) {
    User.find(function (err,docs) {
        res.json(docs);
    });
});

app.get('/user/:username', function (req, res) {
    var username = req.params.username;
    User.findOne({username: username}, function (err,docs) {
        if (err) {
            res.status(401).send('User ' + username + ' was not found');
        } else {
            res.json(docs);
        }
    });
});

app.get('/loggedin', function( req, res) {
    res.send(req.isAuthenticated() ? req.user : null);
});

app.post('/login', passport.authenticate('local'), function (req, res) {
    res.send(req.user);
});

app.post('/logout', function (req, res) {
    req.logOut();
    res.send(200);
}); 

app.post('/register', function(req, res){
    var newuser = req.body;
    User.findOne({username: newuser.username}, function (err,docs) {
        // first check to see if user already has that username (in which case docs would be non-null)
        if (err || docs) {
            // if so, return error and error message saying to pick new username
            res.status(401).send('Username ' + newuser.username + ' already taken. Choose a new username.');
        } else {
            // otherwise insert and log in new user
            insertNewUser(req, res, newuser);
        }
    });
});

function insertNewUser(req, res, newuser)  {
    newuser.following = [];
    mongoose.connectionn.collection('users').insert(newuser, function (err) {
        if (err) {
            res.status(401).send('Error in registration');
        } else {
            passport.authenticate('local')(req, res, function () {
                res.send(req.user);
            });
        }
    });
}

app.put('/saveRide', function (req, res){
    var rideToSave = req.body.rideId;
    User.findOne({username: req.user.username}, function (err, doc) {
        var savedRides = doc.savedRides;
        savedRides.push(rideToSave);
        User.update({username: req.user.username}, {'savedRides': savedRides}, function() {
            req.user.savedRides = savedRides;
            res.send(req.user);
        });
    });

    Ride.update({rideId: rideToSave}, { $inc : {saved: 1} }, function(err){
        if(err){
            console.log('Unable to increment ride saves');
        }
    });
});

app.put('/removeRide', function (req, res){
    var rideToRemove= req.body.rideId;
    User.findOne({username: req.user.username}, function (err, doc) {
        var savedRides = doc.savedRides;
        var index = savedRides.indexOf(rideToRemove);
        savedRides.splice(index, 1);

        User.update({username: req.user.username}, {'savedRides': savedRides}, function() {
            req.user.savedRides = savedRides;
            res.send(req.user);
        });
    });

    Ride.update({rideId: rideToRemove}, { $inc: {saved: -1} }, function(err) {
        if(err){
            console.log('Unable to increment ride saves');
        };
    });
});

// follow a user
// put userToFollow in this user's "Following" array
app.put('/follow', function (req, res) {
    var userToFollow = req.body.username;
    User.findOne({username: req.user.username}, function (err, doc){
        var following = doc.following;
        following.push(userToFollow);
        User.update({username: req.user.username}, {'following': following}, function () {
            req.user.following = following;
            res.send(req.user);
        });
    });
});

// unfollow a user
// remove userToUnfollow from this user's "Following" array
app.put('/unfollow', function (req, res) {
    var userToUnfollow = req.body.username;
    User.findOne({username: req.user.username}, function (err, doc){
        var following = doc.following;
        var index = following.indexOf(userToUnfollow);
        following.splice(index, 1);
        User.update({username: req.user.username}, {'following': following}, function () {
            req.user.following = following;
            res.send(req.user);
        });
    });
});

var RideSchema = new mongoose.Schema({
    name: String,
    description: String,
    rideId: String,
    saved: Number,
    start: String,
    end: String,
    creator: String,
    map: Object,
    dateCreated: Date
});

var Ride = mongoose.model('Ride', RideSchema);

app.post('/ride', function(req, res){
    var ride = req.body;
    ride.dateCreated = new Date();
    ride.saved = 0;
    ride.rideId = mongoose.Types.ObjectId().toString();
    mongoose.connectionn.collection('rides').insert(ride, function(err, docs){
        if(err) {
            res.status(401).send('Error saving ride');
        } else {
            res.json(docs);
        }
    });
});

app.get('/rides', function(req, res) {
    Ride.find(function(err, docs) {
        res.json(docs);
    });
});

app.get('/rides/:rideId', function(req, res){
    var rideId = req.params.rideId;
    Ride.findOne({rideId: rideId}, function(err, doc) {
        res.json(doc);
    });
});

app.get('/ridesByLocation', function(req, res) {
    var lat = req.query.lat,
        lng = req.query.lng,
        searchDistance = req.query.distance;

    Ride.find(function(err, docs){
        var startLoc,
            result = [],
            distance;

        for(var i = 0; i < docs.length; i++) {
            if(docs[i].map) {
                startLoc = docs[i].map.start;
                distance = getDistanceFromLatLonInKm(lat, lng, startLoc.lat, startLoc.lng);
                if(distance < searchDistance) {
                    result.push(docs[i]);
                }
            }
        }
        res.json(result);
    });
});

app.get('/ridesByFollower', function(req ,res){
    User.findOne({username: req.user.username}, function(err, doc) {
        var following = doc.following,
            rides = [],
            iterations = 0;

        function compareByDate(a, b) {
            return b.dateCreated - a.dateCreated;
        }

        for(var i = 0; i < following.length; i++) {

            Ride.find({creator: following[i]}, function(err, docs) {
                if(!err) {
                    if(docs.length > 3) {
                        rides = rides.concat(docs.splice(0, 3));
                    } else {
                       rides = rides.concat(docs);
                    }

                    // make sure we've iterated completely before returning
                    if(++iterations === following.length) {
                        rides.sort(function (a, b) {
                            return b.dateCreated - a.dateCreated;
                        });
                        res.json(rides);
                    }
                }
            });
        }
    });

});

// http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

app.get('/ridesByUser/:username', function(req, res) {
    var username = req.params.username;
    Ride.find({creator: username}, function(err, docs) {
        res.json(docs);
    }).sort({dateCreated:-1});
});

// Review Schema and Model ----------------------------------
var ReviewSchema = new mongoose.Schema({
    content: String,
    username: String,
    rideName: String,
    rideId: String,
    dateCreated: Date
});

var Review = mongoose.model('Review', ReviewSchema);

// get all reviews
app.get('/reviews', function (req, res) {
    Review.find(function (err,docs) {
        res.json(docs);
    });
});

// get all reviews by recipeId (for details pages)
app.get('/reviewsByRide/:rideId', function (req, res) {
    var rideId = req.params.rideId;
    Review.find({rideId: rideId}, function(err, docs) {
        res.json(docs);
    }).sort({dateCreated: -1});
});


// get all reviews by username (for profile pages)
app.get('/reviewsByUser/:username', function (req, res) {
    var username = req.params.username;
    Review.find({username: username}, function (err,docs) {
        res.json(docs);
    }).sort({dateCreated: -1});
});

// save a review from the details page
app.post('/review', function(req, res){
    var review = req.body;
    review.dateCreated = new Date();
    mongoose.connectionn.collection('reviews').insert(review, function (err) {
        if (err) {
            res.status(401).send('Error saving review');
        } else {
            Review.find({rideId: review.rideId}, function(err, docs) {
                res.json(docs);
            }).sort({dateCreated: -1});
        }
    });
});

var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;

app.listen(port, ip);