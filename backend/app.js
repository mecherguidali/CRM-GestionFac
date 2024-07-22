const express = require("express");
const mongoose = require('mongoose');
const app  = express();
require('./config/database.js')
require('./config/passportGoogleAth.js')
const userRouter=require('./router/user.js')
const Admin = require('./models/coreModel/admin.js'); // Adjust the path as necessary
const adminRouter=require('./router/adminRoutes.js')
const authRouteGoogle=require('./router/authGoogle.js')
const personRouter=require('./router/personRoutes.js')
const entrepriseRouter=require('./router/entrepriseRoutes.js')
const clientRouter=require('./router/clientRoutes.js')
const session = require('express-session');
const MongoStore = require('connect-mongo')
var cors = require('cors');
const passport = require('passport');
// use it before all route definitions
app.use(cors())
const detenv = require('dotenv').config()
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(
    session({
      secret: 'your_secret_key',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl:process.env.MONGODB_URI }),
    })
  );
// Session setup
 app.use(passport.initialize());
  app.use(passport.session());
app.use(bodyParser.json());
app.listen(process.env.PORT,()=>{
    console.log(`server is running in port ${process.env.PORT}`);
})
app.use('/api/',adminRouter);
app.use('/api/user/',userRouter);
app.use('/api/people/',personRouter);
app.use('/api/entreprise/',entrepriseRouter);
app.use('/api/client/',clientRouter);
app.use("/auth", authRouteGoogle);

