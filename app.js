require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var session = require('express-session');
var mongoStore = require('connect-mongo');
var indexRouter = require('./routes/index');

var app = express();

const mongoUri = 'mongodb+srv://' + process.env.CLUSTER_ID + ':' + process.env.CLUSTER_PW + '@hariharatravels.du8605o.mongodb.net/';
mongoose.set('strictQuery', false);
mongoose.connect(mongoUri);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/documents',express.static('documents'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cookieParser());
app.use(session({
  secret:process.env.SUPER_SECRET, 
  resave:false, 
  saveUninitialized:false,
  store: mongoStore.create({ mongoUrl : mongoUri }),
  cookie:{maxAge:180*60*1000},
}));

app.use(function(req,res,next){
  res.locals.session = req.session;
  next();
})

app.use('/', indexRouter);

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
