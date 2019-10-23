const express = require("express");
const helmet = require("helmet")
const path = require("path");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const rateLimit = require("express-rate-limit");

const app = express();

// Load Helmet
app.use(helmet())
//Desativa Header X-Powered-by que identifica que a aplicação usa NodeJs ou Php
app.disable('x-powered-by')
//Protege de invasores terem seu codigo desatualizado e com possiveis falhas mesmo apos corrigi-las
app.use(helmet.noCache())
//Content Filter do que pode ser carregado na pagina
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", 'cdnjs.cloudflare.com', 'code.jquery.com', 'stackpath.bootstrapcdn.com']
  }
}))

//Load rateLimit
const apiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 10, //10 requisiçoes
  message:
    "Muitas requisiçoes na pagina tente novamente mais tarde!"
});
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, //3 tentativas
  message:
    "Excedeu as tentativas de login tente novamente em 5 minutos!"
});
app.use("/about/", apiLimiter);
app.use("/index/", apiLimiter);
app.use("/users/register", apiLimiter);
app.use("/users/login", loginLimiter);

// Load routes
const ideas = require("./routes/ideas");
const users = require("./routes/users");

// Passport config
require("./config/passport")(passport);

// Connect to mongoose
mongoose
  .connect("mongodb://localhost/vidjot-dev", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("LOG: MongoDB Connected");
  })
  .catch(err => console.log(err));

// Handlebars middleware
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static folder
app.use(express.static(path.join(__dirname, "public")));

// Express session middleware
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Global Variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;

  next();
});

// Method override meddelware
app.use(methodOverride("_method"));

// Index route
app.get("/", (req, res) => {
  const title = "Bem Vindo";
  res.render("index", {
    title: title
  });
});

app.get("/about", (req, res) => {
  res.render("about");
});

// Use routes
app.use("/ideas", ideas);
app.use("/users", users);

const port = 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
