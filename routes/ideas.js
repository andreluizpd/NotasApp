const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { ensureAuthentication } = require("../helpers/auth");

// Load idea module
require("../models/Idea");
const Idea = mongoose.model("ideas");

// Add idea form
router.get("/add", ensureAuthentication, (req, res) => {
  res.render("ideas/add");
});

// Edit idea form
router.get("/edit/:id", ensureAuthentication, (req, res) => {
  Idea.findOne({
    _id: req.params.id
  }).then(idea => {
    if (idea.user != req.user.id) {
      req.flash("error_msg", "Not Autorized");
      res.redirect("/ideas");
    } else {
      res.render("ideas/edit", { idea });
    }
  });
});

// Idea index page
router.get("/", ensureAuthentication, (req, res) => {
  Idea.find({ user: req.user.id })
    .sort({ date: "desc" })
    .then(ideas => {
      res.render("ideas/index", { ideas });
    });
});

// Process form
router.post("/", ensureAuthentication, (req, res) => {
  let errors = [];

  if (!req.body.title) {
    errors.push({ text: "Please add a title" });
  }
  if (!req.body.details) {
    errors.push({ text: "Please add some details" });
  }

  if (errors.length > 0) {
    res.render("ideas/add", {
      errors: errors,
      title: req.body.title,
      details: req.body.details
    });
  } else {
    let newUser = {
      title: req.body.title,
      details: req.body.details,
      user: req.user.id
    };
    new Idea(newUser).save().then(ideas => {
      req.flash("success_msg", "Video Idea Added");
      res.redirect("/ideas");
    });
  }
});

// Edit form Process
router.put("/:id", ensureAuthentication, (req, res) => {
  Idea.findOne({
    _id: req.params.id
  }).then(idea => {
    // New Values
    idea.title = req.body.title;
    idea.details = req.body.details;

    idea.save().then(idea => {
      req.flash("success_msg", "Video Idea updated");
      res.redirect("/ideas");
    });
  });
});

// Delete idea
router.delete("/:id", ensureAuthentication, (req, res) => {
  Idea.remove({
    _id: req.params.id
  }).then(() => {
    req.flash("success_msg", "Video Idea Removed");
    res.redirect("/ideas");
  });
});

module.exports = router;
