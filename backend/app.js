const express = require("express");
const mongoose = require('mongoose');
const app  = express();
require('./config/database.js')
const userRouter=require('./router/user.js')
const Adminrouter=require('./router/admin.js')
var cors = require('cors');
// use it before all route definitions
app.use(cors())
const detenv = require('dotenv').config()
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.listen(process.env.PORT,()=>{
    console.log(`server is running in port ${process.env.PORT}`);
})
app.use('/',Adminrouter);
app.use('/user',userRouter);

