/**
 * server.js
 * ---------------------------------------------------------------------------
 * CIS 4327 - IS Senior Project I
 * Model View Controller (MVC) Bartender Application
 *
 * Application bootstrap. This file wires the three MVC layers together and
 * starts listening; it contains no business logic of its own.
 *
 *   MODELS      /models       data + logic (all SQL lives here)
 *   VIEWS       /views        EJS templates that render HTML
 *   CONTROLLERS /controllers  receive requests, call models, choose a view
 *   ROUTES      /routes       URL -> controller action map
 * ---------------------------------------------------------------------------
 */

const path = require('path');
const express = require('express');

const { initialize } = require('./config/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

/* --------------------------- Database start-up --------------------------- */
// Creates the tables and seeds the cocktail menu the first time it runs.
initialize();

/* ------------------------------ View engine ------------------------------ */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ------------------------------ Middleware ------------------------------- */
// Parses HTML form POST bodies into req.body for the controllers.
app.use(express.urlencoded({ extended: false }));
// Serves the stylesheet.
app.use(express.static(path.join(__dirname, 'public')));

/* -------------------------------- Routes --------------------------------- */
app.use('/', routes);

/* ------------------------------ 404 handler ------------------------------ */
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    activeNav: null,
    statusCode: 404,
    message: 'That page is not on the menu.'
  });
});

/* --------------------------- 500 error handler --------------------------- */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).render('error', {
    title: 'Server Error',
    activeNav: null,
    statusCode: 500,
    message: 'Something went wrong behind the bar. Please try again.'
  });
});

/* -------------------------------- Listen --------------------------------- */
app.listen(PORT, () => {
  console.log('');
  console.log('  MVC Bartender Application');
  console.log(`  Running at http://localhost:${PORT}`);
  console.log('');
  console.log('  Patron    -> http://localhost:' + PORT + '/menu');
  console.log('  Bartender -> http://localhost:' + PORT + '/queue');
  console.log('');
});

module.exports = app;
