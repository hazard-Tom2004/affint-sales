const mysql = require("mysql");
// const express = require('express');
require("dotenv").config();

// Creating a connection to the database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  token: process.env.DB_ACCESS_TOKEN_SECRET,
  refresh_token: process.env.DB_REFRESH_TOKEN_SECRET,
});

db.connect((err) => {
  if (err) throw err;
  console.log("Successfully connected to the database");
});

module.exports = db;
