var dataService = require("./data.service");
var helperService = require("./helper.service");
var emitterService = require("./emitter.service");
var globalService = require("./global.service");
var userService = require("./user.service");
// var loopback = require("loopback");
// var app = loopback();
var fs = require("fs");
const axios = require("axios");
const ShortcodeTree = require("shortcode-tree").ShortcodeTree;
const chalk = require("chalk");
var { GraphQLClient, gql, request } = require("graphql-request");
var passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy;
const connectEnsureLogin = require('connect-ensure-login');

var frontEndTheme = `${process.env.FRONT_END_THEME}`;
const adminTheme = `${process.env.ADMIN_THEME}`;

module.exports = authService = {
  startup: async function (app) {
    emitterService.on("getRenderedPagePostDataFetch", async function (options) {
      if (options) {
        // options.page.data.showPageBuilder = await userService.isAuthenticated(
        //   options.req
        // );
      }
    });

    // passport.use(
    //   new LocalStrategy(function (email, password, done) {
    //     let loginUser = userService.loginUser(email, password);

    //     if (err) {
    //       return done(err);
    //     }
    //     if (!loginUser) {
    //       return done(null, false, { message: "Incorrect username." });
    //     }
    //     if (!loginUser.validPassword(password)) {
    //       return done(null, false, { message: "Incorrect password." });
    //     }
    //     return done(null, user);
    //   })
    // );

    app.get("/register", async function (req, res) {
      let data = { registerMessage: "<b>admin</b>" };
      res.render("admin/shared-views/admin-register", {
        layout: `front-end/${frontEndTheme}/login.hbs`,
        data: data,
      });
      return;
    });

    app.post("/register", async function (req, res) {
      // var user = loopback.getModel("user");
      let email = req.body.email;
      let password = req.body.password;
      let passwordConfirm = req.body.passwordConfirm;

      let newUser = await userService.createUser(email, password);

      globalService.isAdminUserCreated = true;
      let message = encodeURI(`Account created successfully. Please login`);
      res.redirect(`/login?message=${message}`); // /admin will show the login
      return;
    });

    //TODO: https://www.sitepoint.com/local-authentication-using-passport-node-js/
    app.post('/login', (req, res, next) => {
      passport.authenticate('local',
      (err, user, info) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.redirect('/login?info=' + info);
        }
    
        req.logIn(user, function(err) {
          if (err) {
            return next(err);
          }

          req.session.userId = user.id;
    
          return res.redirect(req.session.returnTo);
        });
    
      })(req, res, next);
    });
    
    
    app.get('/private',
      connectEnsureLogin.ensureLoggedIn(),
      (req, res) => res.sendFile('html/private.html', {root: __dirname})
    );
    
    app.get('/user',
      connectEnsureLogin.ensureLoggedIn(),
      (req, res) => res.send({user: req.user})
    );

    app.get("/login", async function (req, res) {
      let data = { registerMessage: "<b>admin</b>" };
      res.render("admin/shared-views/admin-login", {
        layout: `front-end/${frontEndTheme}/login.hbs`,
        data: data,
      });
      // return;
    });

    app.get("/logout", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
      req.logout();
      res.redirect("/");
    });


    // app.post("/login", passport.authenticate("local"), function (req, res) {
    //   // If this function gets called, authentication was successful.
    //   // `req.user` contains the authenticated user.
    //   res.redirect("/users/" + req.user.username);
    // });



    // app.post("/login", function (req, res) {
    //   console.log('login post');
    // });

    // log a user in
    // app.post("/login", function (req, res) {
    //   var user = app.models.User;
    //   let referer = req.headers.referer;

    //   user.login(
    //     {
    //       email: req.body.email,
    //       password: req.body.password,
    //     },
    //     "user",
    //     function (err, token) {
    //       if (err) {
    //         if (err.details && err.code === "LOGIN_FAILED_EMAIL_NOT_VERIFIED") {
    //           res.render("reponseToTriggerEmail", {
    //             title: "Login failed",
    //             content: err,
    //             redirectToEmail: "/api/user/" + err.details.userId + "/verify",
    //             redirectTo: "/",
    //             redirectToLinkText: "Click here",
    //             userId: err.details.userId,
    //           });
    //         } else if (err.code) {
    //           let urlToRedirect = helperService.urlAppendParam(
    //             referer,
    //             "error",
    //             err.message
    //           );
    //           res.redirect(urlToRedirect);
    //         }
    //         return;
    //       }

    //       //amp
    //       var data = {
    //         event_type: "LOGIN", // required
    //         user_id: req.body.email, // only required if device id is not passed in
    //       };

    //       //set cookie
    //       res.cookie("sonicjs_access_token", token.id, {
    //         signed: true,
    //         maxAge: 30000000,
    //       });

    //       mixPanelService.setPeople(req.body.email);

    //       mixPanelService.trackEvent("LOGIN", req, { email: req.body.email });
    //       if (referer.includes("/admin?")) {
    //         referer = "/admin";
    //       }
    //       res.redirect(referer);
    //     }
    //   );
    // });

    //log a user out
    app.get("/logout", async function (req, res, next) {
      var user = app.models.User;
      var token = req.signedCookies.sonicjs_access_token;
      let currentUser = await userService.getCurrentUser(req);
      if (!token) return res.sendStatus(401);

      user.logout(token, async function (err) {
        if (err) {
          //user already logged out
          res.redirect("/admin");
        }

        //amp
        var data = {
          event_type: "LOGOUT", // required
          user_id: currentUser.email,
        };

        res.clearCookie("sonicjs_access_token");
        res.redirect("/admin");
      });
    });

    emitterService.on("requestBegin", async function (options) {
      if (options.req.url === "/register") {
        options.req.isRequestAlreadyHandled = true;
        let data = { registerMessage: "<b>admin</b>" };
        options.res.render("admin/shared-views/admin-register", {
          layout: `front-end/${frontEndTheme}/login.handlebars`,
          data: data,
        });

        // options.res.sendFile(file);
        // options.req.isRequestAlreadyHandled = true;
        // return;
      }
    });

    // emitterService.on("postBegin", async function (options) {
    //   if (options.req.url === "/register") {
    //     // var user = loopback.getModel("user");
    //     let email = options.req.body.email;
    //     let password = options.req.body.password;
    //     let passwordConfirm = options.req.body.passwordConfirm;

    //     let newUser = await userService.createUser(email, password);

    //     globalService.isAdminUserCreated = true;
    //     let message = encodeURI(`Account created successfully. Please login`);
    //     res.redirect(`/admin?message=${message}`); // /admin will show the login
    //     return;
    //   }
    // });

    // emitterService.on("requestBegin", async function (options) {
    //   if (options.req.url === "/login") {
    //     options.req.isRequestAlreadyHandled = true;

    //     // res.render("admin/shared-views/admin-login", { layout: `front-end/${frontEndTheme}/login.handlebars`, data: data });

    //     let data = { registerMessage: "<b>admin</b>" };
    //     options.res.render("admin/shared-views/admin-login", {
    //       layout: `front-end/${frontEndTheme}/login.handlebars`,
    //       data: data,
    //     });

    //     // options.res.sendFile(file);
    //     // options.req.isRequestAlreadyHandled = true;
    //     // return;
    //   }
    // });

    // emitterService.on("postBegin", async function (options) {
    //   if (options.req.url === "/login") {
    //     let email = options.req.body.email;
    //     let password = options.req.body.password;
    //     console.log(email, password);

    //     // var user = app.models.User;
    //     let referer = req.headers.referer;

    //     //   user.login(
    //     //     {
    //     //       email: req.body.email,
    //     //       password: req.body.password,
    //     //     },
    //     //     "user",
    //     //     function (err, token) {
    //     //       if (err) {
    //     //         if (err.details && err.code === "LOGIN_FAILED_EMAIL_NOT_VERIFIED") {
    //     //           res.render("reponseToTriggerEmail", {
    //     //             title: "Login failed",
    //     //             content: err,
    //     //             redirectToEmail: "/api/user/" + err.details.userId + "/verify",
    //     //             redirectTo: "/",
    //     //             redirectToLinkText: "Click here",
    //     //             userId: err.details.userId,
    //     //           });
    //     //         } else if (err.code) {
    //     //           let urlToRedirect = helperService.urlAppendParam(
    //     //             referer,
    //     //             "error",
    //     //             err.message
    //     //           );
    //     //           res.redirect(urlToRedirect);
    //     //         }
    //     //         return;
    //     //       }

    //     //       //amp
    //     //       var data = {
    //     //         event_type: "LOGIN", // required
    //     //         user_id: req.body.email, // only required if device id is not passed in
    //     //       };

    //     //       //set cookie
    //     //       res.cookie("sonicjs_access_token", token.id, {
    //     //         signed: true,
    //     //         maxAge: 30000000,
    //     //       });

    //     //       mixPanelService.setPeople(req.body.email);

    //     //       mixPanelService.trackEvent("LOGIN", req, { email: req.body.email });
    //     //       if (referer.includes("/admin?")) {
    //     //         referer = "/admin";
    //     //       }
    //     //       res.redirect(referer);
    //     //     }
    //     //   );
    //   }
    // });
  },

  createUser: async function (email, password) {
    const query = gql`
    mutation{
      userCreate(email:"${email}", password:"${password}"){
        email
        id
      }
    }
      `;

    let data = await dataService.executeGraphqlQuery(query);

    return data.contents;
  },

  // getUsers: async function () {
  //   var userModel = loopback.getModel("user");
  //   let users = await userModel.find();
  //   // console.log(users);
  //   return users;
  // },

  // getUser: async function (id) {
  //   var userModel = loopback.getModel("user");
  //   let user = await userModel.findById(id);
  //   return user;
  // },

  // getRoles: async function () {
  //   var roleModel = loopback.getModel("Role");
  //   let roles = await roleModel.find();
  //   // console.log(users);
  //   return roles;
  // },

  // getRole: async function (id) {
  //   var roleModel = loopback.getModel("Role");
  //   let role = await roleModel.findById(id);
  //   return role;
  // },

  // getCurrentUserId: async function (req) {
  //   if (req.signedCookies && req.signedCookies.sonicjs_access_token) {
  //     let tokenInfo = await globalService.AccessToken.findById(
  //       req.signedCookies.sonicjs_access_token
  //     );
  //     if (tokenInfo && tokenInfo.userId) {
  //       return tokenInfo.userId;
  //     }
  //   }
  // },

  // getCurrentUser: async function (req) {
  //   var userModel = loopback.getModel("user");
  //   let a = app;
  //   let userId = await userService.getCurrentUserId(req);
  //   if (userId) {
  //     let user = await userModel.findById(userId);
  //     if (user) {
  //       return user;
  //     }
  //   }
  // },

  // isAuthenticated: async function (req) {
  //   var authCookie = await this.getToken(req);
  //   let userId = await userService.getCurrentUserId(req);
  //   if (authCookie && userId) {
  //     return true;
  //   }
  //   return false;
  // },

  // getToken: async function (req) {
  //   return req.signedCookies.sonicjs_access_token;
  // },
};
