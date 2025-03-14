const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoute = require('./Routes/authRoute');
const bodyParser = require('body-parser');

// require('dotenv').config;


const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.json());


app.use("/api/affint", authRoute);

app.listen(3020, () => {
    console.log("Server listening on port 3020")
})