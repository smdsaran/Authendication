require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

//console.log(md5('1234'));
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/user' , {useNewUrlParser: true , useUnifiedTopology: true , useFindAndModify: false});

const userSchema = new mongoose.Schema({
  email: String , 
  password: String
});



const User = new mongoose.model("User" , userSchema);

app.get("/" , function(req , res) {
  res.render("home");
});

app.get("/login" , function(req , res) {
  res.render("login");
});

app.get("/register" , function(req , res) {
  res.render("register");
});



app.post("/register" , function(req , res) {
  const username = req.body.username;
  const password = req.body.password;

  bcrypt.hash(password, saltRounds, function(err, hash) {
    const newUser = new User({
      email:  username, 
    password: hash
    });
  
    newUser.save(function(err) {
      if(!err) {
        res.render("secrets");
      } else {
        res.send(err);
      }
    });
});

  
});

app.post("/login" , function(req , res) {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username} , function(err , resultDoc) {
    if(resultDoc) {
      bcrypt.compare(password, resultDoc.password , function(err, result) {
        if(result == true)  {
          res.render("secrets");
        }

        else {
          res.send("Username  and password mismatch .")
        }
      });
      }

      
    

    else {
      res.send(err);
    }

  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
