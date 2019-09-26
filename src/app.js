const express = require('express')
const app = express()
// connect to mongodb 
require('./db/mongoose')
// check if in production mode
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
// import all packages
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')

// setup port
const port = process.env.PORT || 3000

// setup handlebars, file extension and view engine
const hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main'
})
app.engine(hbs.extname, hbs.engine, hbs.defaultLayout)
app.set('view engine', hbs.extname)

// import body-parser
app.use(bodyParser.urlencoded({ extended: true }))

// setup method-override
app.use(methodOverride('_method'))

// static files
app.use(express.static('public'))

// route setting
app.use('/', require('./routers/home'))
app.use('/records', require('./routers/record'))
// app.use('/users', require('./routers/user'))

app.listen(port, () => {
  console.log(`Express is listening on port: ${port}`)
})