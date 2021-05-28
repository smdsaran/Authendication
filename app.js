require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


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
  password: String , 
  googleId: String , 
  secret: String 
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User" , userSchema);

passport.use(User.createStrategy());

// For other than local authentication 
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/" , function(req , res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login" , function(req , res) {
  res.render("login");
});

app.get("/register" , function(req , res) {
  res.render("register");
});

app.get("/secrets" , function(req , res) {
  User.find({"secret": {$ne: null}} , function(err , foundres) {
    if(!err) {
      if(foundres) {
        res.render("secrets" , {userwithSecret: foundres});
      }  
    } else {
      console.log(err);
    }
  })
});

app.get("/submit" , function(req , res) {
  if(req.isAuthenticated) {
    res.render("submit");
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

app.post("/submit" , function(req , res) {
  const submittedSecret = req.body.secret;

  console.log(req.user);
  User.findById(req.user.id , function(err , foundedRes) {
    if(foundedRes) {
      foundedRes.secret= submittedSecret;
      foundedRes.save(function(err) {
        if(!err) {
          res.redirect("/secrets");
        }
      })

    }
  })
});

app.post("")

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
