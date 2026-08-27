/**
 * routes/index.js
 * ---------------------------------------------------------------------------
 * ROUTING TABLE - maps each incoming HTTP GET/POST request to the controller
 * action that should handle it. This is the front door referenced in step 2 of
 * the assignment: "A controller that receives the user request as an HTTP GET
 * or POST request."
 *
 * Keeping the map in one small file makes the whole application readable at a
 * glance: URL -> Controller.action.
 * ---------------------------------------------------------------------------
 */

const express = require('express');
const HomeController = require('../controllers/HomeController');
const MenuController = require('../controllers/MenuController');
const OrderController = require('../controllers/OrderController');

const router = express.Router();

/* -------------------------------- Home ---------------------------------- */
// Step 1 - index page / homepage
router.get('/', HomeController.index);

/* ---------------------------- Patron: menu ------------------------------- */
// Steps 2-5 - view the cocktail menu
router.get('/menu', MenuController.index);

/* --------------------------- Patron: ordering ---------------------------- */
// Step 6 - open the order form (CREATE, part 1)
router.get('/order/new', OrderController.newOrder);
// Step 7 - submit the order (CREATE, part 2)
router.post('/order', OrderController.create);
// EDIT an order the patron already placed (part 1: form, part 2: save)
router.get('/order/:id/edit', OrderController.editOrder);
router.post('/order/:id', OrderController.update);
// VIEW a single order confirmation
router.get('/order/:id', OrderController.view);

/* -------------------------- Bartender: queue ----------------------------- */
// Steps 8-10 - VIEW the cocktail order queue
router.get('/queue', OrderController.viewQueue);
// EDIT an order: mark it prepared and ready for the server to pick up
router.post('/queue/:id/ready', OrderController.markReady);

module.exports = router;
