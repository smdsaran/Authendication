require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');


//console.log(md5('1234'));
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/user' , {useNewUrlParser: true , useUnifiedTopology: true , useFindAndModify: false});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email: String , 
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User" , userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/" , function(req , res) {
  res.render("home");
});

app.get("/login" , function(req , res) {
  res.render("login");
});

app.get("/register" , function(req , res) {
  res.render("register");
});

app.get("/secrets" , function(req , res) {
  if(req.isAuthenticated) {
    res.render("secrets");
  }  else {
    res.redirect("login");
  }
});

app.get("/logout" , function(req , res) {
  req.logout();    // this is from passport
  res.redirect("/");
});

app.post("/register" , function(req , res) {
  const username = req.body.username;
  const password = req.body.password;

  User.register({username: username}, password , function(err, user) {  // this is from passportLocalMongoose
    if(err) {
      console.log(err);
      res.redirect("/register");
    }  else {
      passport.authenticate("local")  (req , res , function() {   // this is from passport
        res.redirect("/secrets");
      })
    }
  })

});



app.post("/login" , function(req , res) {
  const username = req.body.username;
  const password = req.body.password;

  const user = new User({
    username: username ,
    password: password
  });

  req.login(user , function(err) {   // this is from passport
    if(err) {
      console.log(err);
    }  else {
      passport.authenticate("local")  (req , res , function() {  // this is from passport
        res.redirect("/secrets");
      })
    }
  })
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
