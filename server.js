const express = require('express')
var bodyParser = require('body-parser')
const app = express()
const bcrypt = require('bcrypt');
var path = require("path");
var url = require('url');
var port = process.env.PORT || 3000;

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var cookieParser = require('cookie-parser');
var myMongodb = require('./myMongoDB');
var session = require('express-session');


app.use(cookieParser());

app.use(session({ secret: "Shh, its a secret!" }));


var sessionChecker = function (req, res, next) {
    var q = url.parse(req.url, true);
    var loginPath = '/login';
    // console.log(req.session.username);
    if (req.session.username) {
        if (q.pathname == loginPath) {
            res.redirect('/');
        }
        else {
            next();
        }
    } else {
        if (q.pathname == loginPath) {
            next();
        }
        else {
            res.redirect('/login');
        }
    }
};

var isInstrucRole = function (req, res, next) {
    if (req.session.role == 'INSTRUCTOR') {
        next();
    }
    else {
        res.redirect('/');
    }
}

// app.route('').get(function (req, res) {
//     res.redirect('/');
// })

app.route('/profile').get(sessionChecker, function (req, res) {
    res.sendFile(path.join(__dirname + '/profile.html'));
})

app.get('/navbar',function(req,res){
    res.sendFile(path.join(__dirname + '/navbar.html'));
})

app.get('/', sessionChecker, function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.route('/logout')
.get(sessionChecker,(req,res)=>{
    req.session.destroy();
    res.redirect('/login');
});

app.route('/login')
    .get(sessionChecker, (req, res) => {

        console.log(req.session);
        res.sendFile(path.join(__dirname + '/login.html'));


    })
    .post(urlencodedParser, sessionChecker, (req, res) => {

        myMongodb.findMongoDB({ 'username': req.body.username }, function (obj) {
            console.log('result: ' + obj);
            if (obj != null) {
                console.log('checking password...');
                bcrypt.compare(req.body.password, obj.password, function (err, result) {
                    if (result) {
                        req.session.username = req.body.username;
                        req.session.role = obj.role;
                        req.session.firstname = obj.firstname;
                        req.session.lastname = obj.lastname;
                        req.session.nickname = obj.nickname;
                        req.session.birthday = obj.birthday;
                        req.session.gender = obj.gender;
                        console.log(req.session);
                        res.redirect('/');
                    }
                    else {
                        res.redirect('/login');
                    }
                });
                console.log('checking password complete');
            }
            else {
                res.redirect('/login');
            }
        });


    })


app.get('/registration', function (req, res) {

    res.sendFile(path.join(__dirname + '/registration.html'));
})

app.post('/registration', urlencodedParser, function (req, res) {
    const saltRounds = 10000
    bcrypt.genSalt(saltRounds, function (err, getsalt) {
        bcrypt.hash(req.body.password, getsalt, function (err, gethash) {
            salt = getsalt
            hash = gethash
            console.log(req.body);
            var insertData = {
                'username': req.body.username,
                'password': hash,
                'firstname': req.body.firstname,
                'lastname': req.body.lastname,
                'nickname': req.body.nickname,
                'birthday': req.body.birthday,
                'gender': req.body.gender,
                'role': req.body.role
            };
            myMongodb.insertMongoDB("user", insertData);
            res.redirect('/login');
        })
    })

})

app.route('/getUserData')
    .get((req, res) => {

        var result = myMongodb.findMongoDB({ "username": req.session.username }, (result) => { res.json(result); });
    });

app.route('/updateData')
    .get(sessionChecker,(req, res) => {
        res.redirect('/');
    })
    .post(urlencodedParser,sessionChecker,(req, res) => {
        console.log(req.body);
        var insertData = "{";

        var datalist = req.body;
        var items = new Array();
        for (item in datalist) {
            if (datalist[item] && datalist[item] != '') {
                items.push('"'+item+'":"'+datalist[item]+'"');
            }
        }
        insertData  += items.join(",");
        insertData += "}";
        myMongodb.updateMongoDB("user", JSON.parse(insertData), { "username": req.session.username });
        res.redirect('/');
    })

app.route('/getdata')
    .get((req, res) => {
        var query = "{";
        var datalist = JSON.parse(req.query.data);
        console.log(datalist);
        console.log(req.query);
        var items = new Array();
        for (item in datalist) {
            if (datalist[item] && datalist[item] != '') {
                // if(item == "courseTime"){
                //     items.push('"courseStartTime": {"$gte": "' + datalist[item] +'"}');
                //     items.push('"courseEndTime": {"$lte": "' + datalist[item] +'"}');
                // }else {
                    items.push('"' + item + '": {"$regex": "' + ".*" + datalist[item] + ".*" + '"}');
                // }
                
            }

        }

        query += items.join(",");
        query += "}";
        console.log(query);
        jsonQuery = JSON.parse(query);
        var result = myMongodb.queryMongoDB(req.query.collection, jsonQuery, (result) => { res.json(result); });


    })


app.route('/addData')
    .get(sessionChecker, isInstrucRole, (req, res) => {
        res.sendFile(path.join(__dirname + '/addData.html'));


    })
    .post(urlencodedParser, sessionChecker, isInstrucRole, (req, res) => {
        console.log(req.body);
        var insertData = {
            'coursename': req.body.coursename,
            'courseDay': req.body.courseDay,
            'courseStartTime': req.body.courseStartTime,
            'courseEndTime': req.body.courseEndTime,
            'courseDescription': req.body.courseDescription,
            'courseCategory': req.body.courseCategory,
            'courseSubject': req.body.courseSubject,
            'numberOfStudent': parseInt(req.body.numberOfStudent),
            'createBy': req.session.firstname + " " + req.session.lastname
        };
        console.log(insertData);
        myMongodb.insertMongoDB("course", insertData);
        res.redirect('/');
    });

app.listen(port, function () {
    console.log('Example app listening on port 3000!')
})