var MongoClient = require('mongodb').MongoClient;
// mongodb://admin:passw0rd@ds157762.mlab.com:57762/heroku_xnjwt40p
var url = 'mongodb://admin:passw0rd@ds155862.mlab.com:55862/heroku_5f1z1spq';
var dbname =  'heroku_5f1z1spq';
exports.connectMongoDB = function () {

    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db(dbname);
        dbo.createCollection("user", function (err, res) {
            if (err) throw err;
            console.log("Collection created!");
            db.close();
        });
    })
}

exports.queryMongoDB = function (collection, query,callback) {
    var queryResult;
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db(dbname);
        dbo.collection(collection).find(query).toArray(function (err, result) {
            if (err) throw err;
            queryResult = result;
            console.log(queryResult);

            db.close();
            callback(result);
        });        
    });
};

exports.findMongoDB = function (query, callback) {
    var findResult;
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db(dbname);
        dbo.collection("user").findOne(query, function (err, result) {
            if (err) throw err;
            console.log(result);
            findResult = result;
            db.close();
            callback(result);
        });
    });


}

exports.insertMongoDB = function (collection,obj) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db(dbname);
        dbo.collection(collection).insertOne(obj, function (err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
    });
}

exports.updateMongoDB = function(collection,data,query){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(dbname);
        var newvalues = { $set: data };
        console.log(newvalues);
        dbo.collection(collection).updateOne(query, newvalues, function(err, res) {
          if (err) throw err;
          console.log("1 document updated");
          db.close();
        });
      });
}