const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { ensureAuthentication } = require("../helpers/auth");

// Load idea module
require("../models/Idea");
const Idea = mongoose.model("ideas");

router.get("/add", ensureAuthentication, (req, res) => {
  res.render("ideas/add");
});

router.get("/edit/:id", ensureAuthentication, (req, res) => {
  Idea.findOne({
    _id: req.params.id
  }).then(idea => {
    if (idea.user != req.user.id) {
      req.flash("error_msg", "Acesso nao Autorizado");
      res.redirect("/ideas");
    } else {
      res.render("ideas/edit", { idea });
    }
  });
});

router.get("/", ensureAuthentication, (req, res) => {
  Idea.find({ user: req.user.id })
    .sort({ date: "desc" })
    .then(ideas => {
      res.render("ideas/index", { ideas });
    });
});

router.post("/", ensureAuthentication, (req, res) => {
  let errors = [];

  if (!req.body.title) {
    errors.push({ text: "Adicione um titulo" });
  }
  if (!req.body.details) {
    errors.push({ text: "Adicione os detalhes" });
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
      req.flash("success_msg", "Ideia Adicionada");
      res.redirect("/ideas");
    });
  }
});

router.put("/:id", ensureAuthentication, (req, res) => {
  Idea.findOne({
    _id: req.params.id
  }).then(idea => {
    // New Values
    idea.title = req.body.title;
    idea.details = req.body.details;

    idea.save().then(idea => {
      req.flash("success_msg", "Ideia Atualizada");
      res.redirect("/ideas");
    });
  });
});

router.delete("/:id", ensureAuthentication, (req, res) => {
  Idea.remove({
    _id: req.params.id
  }).then(() => {
    req.flash("success_msg", "Ideia Removida");
    res.redirect("/ideas");
  });
});

module.exports = router;
