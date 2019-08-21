'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');

var cors = require('cors');
const dns = require('dns');

let Schema = mongoose.Schema;

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Link schema
const Link = new Schema({
  original_url: String,
  short_url: Number
});

// URL model for further use
const URL = mongoose.model("URL", Link);

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.post("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// main API endpoint - POST
app.post("/api/shorturl/new", (req, res) => {
  // Get the url for storing in the database
  const mainUrl = req.body.url;
  // A copy for lookup
  // dns.lookup can't use http or https
  // must be www.example.com
  let url = mainUrl;
  if (req.body.url.includes("https://")) {
    url = req.body.url.replace("https://", '');
  } else if (req.body.url.includes("http://")) {
    url = req.body.url.replace("http://", '');
  }
  
  // Check if url is correct (exists)
  dns.lookup(url, (err, address, family) => {
    if (err) {
      // If a url is invalid, exit out of the function and
      // send the error message
      return res.send({error: "invalid URL"});
    }
    // Find latest entry for short_url incrementing
    URL.find().sort({short_url:-1}).limit(5).exec((err, data) => {
      const newLink = data[0]["short_url"] + 1;
      const linkToAdd = new URL({original_url: mainUrl, short_url: newLink});
      linkToAdd.save(err => {
        if (err) {
          res.send({error: "something went wrong"});
        } else {
          res.send({original_url: mainUrl, short_url: newLink});
        }
      })
      //URL.save(linkToAdd)
    });
  }); 
});


// main API endpoint - GET
app.get("/api/shorturl/:num?", (req, res) => {
  // For getting the number input
  // TODO check if it actually is a number and not a string
  const shorted = req.params.num;
  
  URL.findOne({short_url: shorted}, (err, data) => {
    if (err) {
      return;
    }
    res.redirect(data["original_url"]);    
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});