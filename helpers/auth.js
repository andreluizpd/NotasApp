module.exports = {
  ensureAuthentication: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error_msg", "Acesso nao autorizado");
    res.redirect("/users/login");
  }
};
