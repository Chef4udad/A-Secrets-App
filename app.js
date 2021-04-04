// ALL NODEJS DEPENDENCIES
require('dotenv').config(); //ENVIRONMENTAL PACKAGE -> ALWAYS ON TOP.
const express = require("express");
const bodyParser = require("body-Parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session'); //NPM PACKAGE FOR SESSION AND COOKIES.
const passport = require("passport"); //NPM PACKAGE FOR SESSION AND COOKIES.
const pLM = require("passport-local-mongoose"); //NPM PACKAGE FOR SESSION AND COOKIES. NO NEED FOR DEFINE passport-local.
const GoogleStrategy = require('passport-google-oauth20').Strategy; //GOOGLE OAUTH Configure Strategy(LEVEL-6).
const findOrCreate = require('mongoose-findorcreate'); //GOOGLE OAUTH Configure Strategy(LEVEL-6). PACKAGE.
/*
const encrypt = require("mongoose-encryption");
*/
// var md5 = require('md5'); // FOR HASHING.
//var bcrypt = require("bcrypt");  // FOR BCRYPT HASHING
// const saltRounds = 10; // FOR BCRYPT HASHING

//SOME ALWAYS USE FUNCTION
const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

//ADD ONLY FOR ENV VARIABLES.
/*
console.log(process.env.API_KEY);
*/

//FOR SESSION INITILISATION
app.use(session({
  secret: "secretsecretsecretsssss",
  resave: false,
  saveUninitialized: false
}));

//FOR PASSPORT INITILISATION (READ PASSPORT.JS DOCUMENTATION).
app.use(passport.initialize());
app.use(passport.session());


//CONNECT MONGODB(userDB is your Database Name.)
mongoose.connect("mongodb://localhost:27017/userDB", {useUnifiedTopology: true}, { useNewUrlParser: true });

//FOR NOT SHOWING ERR IN TERMINAL WHILE RUNNING IN COOKIE CASE(LEVEL-5).
mongoose.set("useCreateIndex", true);

//WORK ON MONGOOSE
// NOTE:- THIS (new mongoose.Schema) Add only for Encryption(Level-2).
const userSchema = new mongoose.Schema({ // An Object
  email : String,
  password : String,
  googleId: String
});

//passport-local-mongoose INITIALISATION. AND GOOGLE OAUTH.
//YOUR userSchema LOOKS LIKE ABOVE.
userSchema.plugin(pLM);
userSchema.plugin(findOrCreate);
//Add only for Encryption(Level-2).->ONLY THESE 2 LINES.
/* const secret = "okklittlesecret."; */ //THIS IS COMMENTED OUT BECAUSE MAKING ITS A ENV VARIABLE.
/*
userSchema.plugin(encrypt, {secret:process.env.SECRET  , encryptedFields: ['password'] });
*/

const user = new mongoose.model("user", userSchema); //MAKE A COPY OF SCHEMA.

//SET PASSPORT WORK.(3-LINES)
passport.use(user.createStrategy());
/*
//THESE LINES ARE COMMENTED OUT BECAUSE IT WORKS ONLY ON LOCAL ENVIRONMENT OF passport-local-mongoose.
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
*/

//PASSPORT.JS SERIALISATION AND DESERIALISATION.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  user.findById(id, function(err, user) {
    done(err, user);
  });
});



//GOOGLE OAUTH SETUP.
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" //FOR GOOGLE++ DEPCRIPTIVE API.
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    user.findOrCreate({ googleId: profile.id }, function (err, user) { //findOrCreate is a pseudo function make by passport.js, its not exist.
      return cb(err, user);
    });
  }
));


// console.log(md5("jaiho"));

//SHOW WHAT IS ON MAIN PAGE(WHEN YOU START SERVER)
//MAKES THE ROUTES THROUGH MAIN ROUTE(PAGE),
app.get("/",(req,res)=>{
   res.render("home"); //EJS FILE.
});

//GET REQUEST FOR GOOGLE BUTTON (href=auth/google)
app.get("/auth/google",
  passport.authenticate("google", {scope: [ 'email', 'profile' ], prompt: 'select_account'  }) // AUTHENTICATE TO WHICH(EG:-FACEBOOK,TWITTER).
);

//GET REQUEST FOR WHERE GOOGLE SEND THE USER AFTER SIGNING BY GOOGLE ID.
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login",(req,res)=>{
   res.render("login"); //EJS FILE.
});

app.get("/register",(req,res)=>{
   res.render("register"); //EJS FILE.
});

//THIS ROUTE IS ONLY FOR AUTHENTICATION PURPOSE.(LEVEL-5)
app.get("/secrets", (req,res)=>{
    if(req.isAuthenticated()){
      res.render("secrets");
    }
    else{
      res.redirect("/login");
    }
});

app.get("/logout",(req,res)=>{ //DEAUTHONITICATE THE USER.
  req.logout();
  res.redirect("/");
});
// FROM REGISTER PAGE(YOU ARE NOT IN MAIN PAGE) TO MAIN PAGE.
/*
app.post("/register",(req,res)=>{
   res.redirect("/");
});
*/

//NOW USER IS REGISTER.
app.post("/register",(req,res)=>{
    user.register({username:req.body.username}, req.body.password, function(err, user) {
      if(err){
        comsole.log(err);
      }
      else{
        passport.authenticate("local")(req,res, function(){
          res.redirect("/secrets");
      });
      }
    });
});
  /*
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) { // THIS FUNCTION ONLY FOR BCRYPT PASSWORD.
    const newUser = new user({  // Constructor Function.
      email: req.body.username, //(username is name field in register form.)
      //password : md5(req.body.password) //(password is name field in register form.) md5 only for hashing.
      password : hash // THIS LINE ONLY FOR BCRYPT PASSWORD.
    });
    newUser.save(err => { //save the dataname.
      if(err){
        console.log(err);
      }
      else{
        res.render("secrets");
      }
    });
 });
});
*/

//NOW USER LOGIN.
app.post("/login",(req,res)=>{
   const newUser = new user ({
     username: req.body.username,
     password: req.body.password
   });
  req.login(newUser, (err)=>{
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req,res, function(){
        res.redirect("/secrets");
    });
    }
  })

});
  /*
  const username = req.body.username;
  const password = req.body.password;
  // const password = md5(req.body.password); // md5 only for hashing.

  user.findOne({email : username}, function(err, foundUser){
    if(err){
      console.log(err);
    }
    /*
    else if (foundUser.password === password){
      res.render("secrets");
    }
    */
    /*
    else if(founduser){
      bcrypt.compare(password, foundUser.password , function(err, result) {
            if(result){
             res.render("secrets");
           }
      });
    }
  });
});
*/




//RUN IN LOCALHOST 3000.
app.listen(3000, ()=>{
  console.log("Your server is on.");
});
