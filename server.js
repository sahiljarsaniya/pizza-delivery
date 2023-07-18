require('dotenv').config()
const express = require('express')
const app = express()
const ejs = require('ejs')
const path = require("path");
const expressLayout = require('express-ejs-layouts')
const PORT = process.env.PORT || 3000
const mongoose = require("mongoose")
const session = require('express-session');
const flash = require('express-flash')
const MongoStore = require('connect-mongo');
const passport = require('passport')
const Emitter = require('events')
;

// Database connection
// const url = 'mongodb://127.0.0.1:27017/pizza';


mongoose.connect(process.env.MONGO_CONNECTION_URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
);
const connection = mongoose.connection;

connection.on('error', console.error.bind(console, "connection error:"));
connection.once('open', function () {
    console.log('Database connected...');
});


//Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)


//session-config
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_CONNECTION_URL,
        collection: 'sessions'
    }),   
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }  // 24 hour
}))
app.use(flash())

//passport config
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())
//assest
app.use(express.static("public"))
app.use(express.urlencoded({extended: false}))
app.use(express.json())

//Gloobal middleware
app.use((req,res,next)=>{
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})
//set Template engine

app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')



require('./routes/web')(app)
app.use((req,res)=>{
    res.status(404).send('<h1>404, Page not found</h1>')
})


const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})  

//socket

const io = require('socket.io')(server)
io.on('connection', (socket)=>{
    // join 
    // console.log(socket.id)
    socket.on('join', (orderId)=>{
        // console.log(orderId)
        socket.join(orderId)
    })
})

eventEmitter.on('orderUpdated', (data)=>{
    // console.log('sever.js working')
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data)=>{
    io.to('adminRoom').emit('orderPlaced', data)
})   