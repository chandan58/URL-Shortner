const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes/route.js');

const { default : mongoose } = require('mongoose');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://chandandas:CsL3xmXiGHNnwran@cluster0.3q2ao.mongodb.net/test", {useNewUrlParser : true})
.then( () => console.log('mongoDB is connected'))
.catch( err => console.log(err))


app.use('/', route);

app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});