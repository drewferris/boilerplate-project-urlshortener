"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var crypto = require("crypto");
var dns = require("dns");
var cors = require("cors");

var Schema = mongoose.Schema;

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

/** this project needs a db !! **/

mongoose.connect(process.env.DB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

const urlSchema = new Schema({
  original_url: String,
  short_url: String,
});

const Url = mongoose.model("Url", urlSchema);

app.post("/api/shorturl/new", function (req, res) {
  console.log(req.body);
  const { body } = req;
  const { url } = body;
  const stub = url.split("://")[1];

  dns.lookup(stub, (err, address, family) => {
    if (err) {
      return res.json({ error: "invalid URL" });
    }

    const hash = crypto.createHash("sha256");
    hash.update(url);

    const urlData = { original_url: url, short_url: hash.digest("hex") };
    const newUrl = new Url(urlData);

    newUrl.save(function (err, data) {
      if (err) return console.error(err);
    });

    res.json(urlData);
  });
});

app.get("/api/shorturl/:id", (req, res) => {
  const { params } = req;
  const { id } = params;

  Url.find({ short_url: id }, (err, data) => {
    if (err) {
      res.json({err});
    }
    res.redirect(data[0].original_url);
  });
});

app.listen(3000, function () {
  console.log("Node.js listening ...");
});
