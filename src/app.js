const express = require('express')
require('./db/mongoose')
const app = express()
// check if not in production mode
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const port = process.env.PORT || 3000
const hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main'
})


// setup handlebars engine and file extension

app.engine(hbs.extname, hbs.engine, hbs.defaultLayout)
app.set('view engine', hbs.extname)

// import body-parser
app.use(bodyParser.urlencoded({ extended: true }))

// setup method-override
app.use(methodOverride('_method'))

// setup express-session
app.use(session({
  secret: 'secretKey belong to Mina',
  resave: false,
  saveUninitialized: true
}))

// setup passport
app.use(passport.initialize())
app.use(passport.session())

// setup connect-flash
app.use(flash())

// import passport config
require('../config/passport')(passport)
app.use((req, res, next) => {
  res.locals.user = req.user
  res.locals.isAuthenticated = req.isAuthenticated()
  res.locals.success_msg = req.flash('success_msg')
  res.locals.warning_msg = req.flash('warning_msg')
  next()
})



// static files
app.use(express.static("public"))

// use route
app.use('/records', require('./routers/record'))
app.use('/', require('./routers/home'))
app.use('/users', require('./routers/user'))
app.use('/auth', require('./routers/auths'))



// set up listening on Express server
app.listen(port, () => {
  console.log(`Express is listening on localhost ${port}`)
})