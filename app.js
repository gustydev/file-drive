require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require("express-session");
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcryptjs');
const prisma = require('./prisma/client');
const compression = require('compression');
const helmet = require('helmet');
const RateLimit = require("express-rate-limit");

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const fileRouter = require('./routes/file');
const folderRouter = require('./routes/folder');

const app = express();

const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
});
app.use(limiter);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(compression());
app.use(helmet.contentSecurityPolicy({
  directives: {
    "img-src": ['res.cloudinary.com']
  }
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session
app.use(session({ 
  secret: process.env.SECRET, 
  resave: false, 
  saveUninitialized: true,
  store: new PrismaSessionStore(
    prisma,
    {
      checkPeriod: 2 * 60 * 1000,  //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }
  )
 })
);

app.use(passport.session());

// passport functions
passport.use(
  new LocalStrategy({passReqToCallback: true}, async (req, username, password, done) => {
    try {
      req.session.messages = []; // Clear messages to avoid duplication
      const user = await prisma.user.findFirst({where: {name: username}});
      if (!user) {
        return done(null, false, { message: "Incorrect username. Please try again" });
      };

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect password. Please try again" });
      }

      return done(null, user);
    } catch(err) {
      return done(err);
    };
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      include: {
        folders: {
          include: {
            files: true, // Include file info for each folder
          },
        },
        files: {
          include: {
            folder: true // Include the folder info for each file
          }
        },
      },
    });
    done(null, user);
  } catch(err) {
    done(err);
  };
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', fileRouter);
app.use('/', folderRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
