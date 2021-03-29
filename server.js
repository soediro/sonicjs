const fs = require("fs");
initEnvFile();
require("dotenv").config();
const express = require("express");
const graphqlHTTP = require("express-graphql");
const schema = require("./server/schema/schema");
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const app = express();
const { request, gql } = require("graphql-request");
const path = require("path");
const chalk = require("chalk");
// var express = require("express");
var exphbs = require("express-handlebars");
var Handlebars = require("handlebars");
var logSymbols = require('log-symbols');
var globalService = require("./server/services/global.service");
var installService = require("./server/services/install.service");

const routes = require("./server/boot/routes.js");
var appRoot = require("app-root-path");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const port = `${process.env.PORT}`;
const frontEndTheme = `${process.env.FRONT_END_THEME}`;
const adminTheme = `${process.env.ADMIN_THEME}`;

const passport = require("passport");
const mongoose = require("mongoose");



mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const User = require("./server/schema/models/user");


mongoose.connection.once("open", async () => {
  console.log(logSymbols.success, 'Successfully connected to database!');

  await installService.checkInstallation();
});


app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  resave: true,
  saveUninitialized: true
}));

setupGraphQL(app);

function start() {

  setupAssets(app);

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  setupHandlebars(app);

  passport.use(User.createStrategy());
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
  app.use(passport.initialize());
  app.use(passport.session());

  routes.loadRoutes(app);

  app.listen(port, () => {
    var baseUrl = `http://localhost:${port}`;
    globalService.baseUrl = baseUrl;

    console.log(chalk.cyan("Website at: ", baseUrl));
    console.log(chalk.cyan("Admin console at: ", baseUrl + "/admin"));
    console.log(chalk.cyan("GraphQL API at: ", baseUrl + "/graphql"));

    app.emit("started");
  });
}

function setupGraphQL(app) {
  app.use(
    "/graphql",
    graphqlHTTP({
      //Directing express-graphql to use this schema to map out the graph
      schema,
      //Directing express-graphql to use graphiql when goto '/graphql' address in the browser
      //which provides an interface to make GraphQl queries
      graphiql: true,
    })
  );
}

function initEnvFile() {
  const path = "./.env";

  try {
    if (!fs.existsSync(path)) {
      //create default env file
      fs.copyFile(".env-default", ".env", (err) => {
        if (err) {
          console.log('initEnvFile error');
          throw err;
        }
        console.log(".env-default was copied to .env");
      });
    }
  } catch (err) {
    console.log('initEnvFile catch error');
    console.error(err);
  }
}

function setupHandlebars(app) {
  let themeDirectory = path.join(__dirname, "server/themes");
  let partialsDirs = [
    path.join(__dirname, "server/themes", "front-end", "bootstrap", "partials"),
    path.join(
      __dirname,
      "server/themes",
      "front-end",
      frontEndTheme,
      "partials"
    ),
    path.join(__dirname, "server/themes", "admin", adminTheme, "partials"),
    path.join(__dirname, "server/themes", "admin", "shared-partials"),
  ];

  var hbs = exphbs.create({
    layoutsDir: path.join(themeDirectory),
    partialsDir: partialsDirs,
    extname: '.hbs'
  });

  app.engine(".hbs", hbs.engine);
  app.set("view engine", ".hbs");
  app.set("views", __dirname + "/server/themes");

  setupHandlebarsHelpers();
}

function setupHandlebarsHelpers() {
  Handlebars.registerHelper({
    eq: function (v1, v2) {
      return v1 === v2;
    },
    ne: function (v1, v2) {
      return v1 !== v2;
    },
    lt: function (v1, v2) {
      return v1 < v2;
    },
    gt: function (v1, v2) {
      return v1 > v2;
    },
    lte: function (v1, v2) {
      return v1 <= v2;
    },
    gte: function (v1, v2) {
      return v1 >= v2;
    },
    and: function () {
      return Array.prototype.slice.call(arguments).every(Boolean);
    },
    or: function () {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    },
    json: function (context) {
      return JSON.stringify(context);
    },
  });
}

function setupAssets(app) {
  app.use(express.static("server/storage/css"));
  // app.use('/node_modules', express.static(__dirname + '/node_modules'))
  app.use("/themes", express.static(path.join(appRoot.path, "server/themes")));

  app.use(
    "/node_modules",
    express.static(path.join(appRoot.path, "node_modules"))
  );
  app.use(
    "/vendors",
    express.static(path.join(appRoot.path, "server/assets/vendors"))
  );
  app.use(
    "/css",
    express.static(path.join(appRoot.path, "server/storage/css"))
  );
  app.use("/js", express.static(path.join(appRoot.path, "server/storage/js")));
  app.use(
    "/js",
    express.static(path.join(appRoot.path, "server/storage/files"))
  );
  app.use(
    "/services",
    express.static(path.join(appRoot.path, "server/services"))
  );
  app.use(
    "/page-builder",
    express.static(path.join(appRoot.path, "server/page-builder"))
  );
  app.use(
    "/assets",
    express.static(path.join(appRoot.path, "server/assets"))
  );
  app.use(
    "/api/containers/files/download",
    express.static(path.join(appRoot.path, "server/storage/files"))
  );
  app.use(
      "/api/containers/files/upload",
      express.static(path.join(appRoot.path, "server/storage/files"))
  );
  app.use(
    "/assets/fonts",
    express.static(path.join(appRoot.path, "node_modules/font-awesome/fonts"))
  );
  app.use(
    "/",
    express.static(path.join(appRoot.path, "/node_modules/ace-builds/src-min-noconflict"))
  );
}

start();
