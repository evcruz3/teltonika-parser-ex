var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://tft-server:tft100@167.71.159.65:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("tft-server");
  dbo.collection("AVL DATA").find({}).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
    db.close();
  });
});