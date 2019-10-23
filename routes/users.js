const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const request = require("request");
const router = express.Router();

// Load User model
require("../models/User");
const User = mongoose.model("users");
const SECRET_KEY = "6Ld40r0UAAAAACBZHP6Nstgu44ylMLu6HcyJ6SZn";

// User login route
router.get("/login", (req, res) => {
  res.render("users/login");
});

// Login form post
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/ideas",
    failureRedirect: "/users/login",
    failureFlash: true
  })(req, res, next);
});

function verifyCaptchaHasErrors(url, captcha) {
  if (
    captcha === undefined ||
    captcha === "" ||
    captcha === null
  ) {
    return true;
  } else {
    request(url, (err, res, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        return true;
      } else {
        return false;
      }
    });
  }
}

// User register route
router.get("/register", (req, res) => {
  res.render("users/register");
});

// Resgiter form  POST
router.post("/register", (req, res) => {
  let errors = [];
  
  const callbackUrl = `https://google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${req.body['g-recaptcha-response']}&remoteip=${req.connection.remoteAddress}`;

  if(verifyCaptchaHasErrors(callbackUrl, req.body['g-recaptcha-response'])) {
    errors.push({ text: "Captcha errado" });
  }

  if (req.body.password != req.body.password2) {
    errors.push({ text: "Senhas nao conferem" });
  }

  if (req.body.password.length < 4) {
    errors.push({ text: "A senha precisa ter no minimo 4 caracteres" });
  }

  if (errors.length > 0) {
    res.render("users/register", {
      errors,
      name: req.body.name,
      email: req.body.email
    });
  } else {
    User.findOne({ email: req.body.email }).then(user => {
      if (user) {
        req.flash("error_msg", "Email ja registrado");
        res.redirect("/users/register");
      } else {
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  "success_msg",
                  "Registrado com sucesso, agora ja pode fazer login"
                );
                res.redirect("/users/login");
              })
              .catch(err => {
                console.log(err);
                return;
              });
          });
        });
      }
    })
    .catch(err => {
      console.log(err);
    });
  }
});

// logout user
router.get("/logout", (req, res) => {
  req.logOut();
  req.flash("success_msg", "Logout realizado com sucesso");
  res.redirect("/users/login");
});

module.exports = router;
