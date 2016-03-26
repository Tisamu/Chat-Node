var express = require('express');
var fs = require('fs');
var router = express.Router();
var password = require('password-hash');
var busboy = require('connect-busboy');
var url = 'mongodb://localhost:27017/Chat';
var easyimg = require('easyimage');

function randColor() {
    var R = Math.floor((Math.random() * 255) + 1);
    var G = Math.floor((Math.random() * 255) + 1);
    var B = Math.floor((Math.random() * 255) + 1);
    var color = 'rgb(' + R + ',' + G + ',' + B + ')';
    return color;
}

/* GET home page. */
router.get('/', function (req, res, next) {
    var sess = req.session;
    res.render('index', {
        title: 'Chat',
        username: sess.username,
        color: sess.color
    });
});

//Profile Page
router.get('/profile', function (req, res) {
    var sess = req.session;
    res.render('profile', {
        username: sess.username,
        color: sess.color
    });
});

//Logout route
router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});
//Register Page
router.get('/register', function (req, res) {
    res.render('register');
});
//User Management
router.post('/registerUser', function (req, res) {
    //Mongo Connection part
    var userColor = randColor();
    var MongoClient = require('mongodb').MongoClient;
    var ObjectId = require('mongodb').ObjectID;
    MongoClient.connect(url, function (err, db) {
        if (err === null) {
            console.log('Connected to Mongo.');
            insertUser(db, function () {
                db.close();
            });
        }
    });

    var insertUser = function (db, callback) {
        var hashedPassword = password.generate(req.body.password);
        db.collection('users').insertOne({
            "username": req.body.username,
            "password": hashedPassword,
            "color": userColor
        }, function (err, result) {
            if (err === null) {
                console.log('New User registered.');
                callback();
            }
        });
    };
    res.end('done');
});

router.post('/updateUser', function (req, res) {
    var sess = req.session;
    var username = req.body.username;
    var newColor = req.body.color;
    sess.color = newColor;
    var MongoClient = require('mongodb').MongoClient;
    var ObjectId = require('mongodb').ObjectID;
    MongoClient.connect(url, function (err, db) {
        if (err === null) {
            console.log('Connected to Mongo.');
            updateProfile(db, function () {

                db.close();
            });
        }
    });

    var updateProfile = function (db, callback) {
        db.collection('users').update(
                {username: username},
                {
                    $set: {
                        color: newColor
                    }
                }, function (err) {
            if (err === null) {
                console.log('Color Updated');
                callback();
            }
        });
    };
    res.end('done');
});

router.post('/loginUser', function (req, res) {
    var response;
    var sess = req.session;
    //Mongo Connection part
    var MongoClient = require('mongodb').MongoClient;
    var ObjectId = require('mongodb').ObjectID;
    MongoClient.connect(url, function (err, db) {
        if (err === null) {
            checkUser(db, function () {
                db.close();
                res.send(response);
            });
        }
    });
    var checkUser = function (db, callback) {
        db.collection('users').find({
            username: req.body.username
        }).toArray(function (err, result) {
            if (err) {
                console.log(err);
            } else if (result.length) {
                if (password.verify(req.body.password, result[0].password)) {
                    sess.color = result[0].color;
                    sess.username = req.body.username;
                    response = ['connect', sess.color];
                } else {
                    response = ['wpass', 'null'];
                }
            } else {
                response = ['notfound', 'null'];
            }

            callback();
        });
    };
});

router.post('/uploadAvatar', function (req, res) {
    var sess = req.session;
    var fstream;
    req.pipe(req.busboy);

    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);
        fstream = fs.createWriteStream('public/upload/' + sess.username + '.png');
        file.pipe(fstream);
        fstream.on('close', function () {
            res.redirect('back');
        });
    });
    easyimg.rescrop({
        src: 'public/upload/' + sess.username + '.png', dst: 'public/upload/' + sess.username + '.png',
        width: 128, height: 128,
        x: 0, y: 0
    }).then(
            function (image) {
                console.log('Resized and cropped: ' + image.width + ' x ' + image.height);
            },
            function (err) {
                console.log(err);
            }
    );
});

module.exports = router;