/**
 * controllers/HomeController.js
 * ---------------------------------------------------------------------------
 * CONTROLLER - Home / index page.
 *
 * Step 1 of the request flow: "Index page that acts as a homepage for the
 * Bartender application from where patrons can access the order option and
 * from where bartenders can access the order queue option."
 *
 * A controller's job is only this: receive the request, ask the model for
 * whatever data is needed, then hand that data to a view. No SQL, no HTML.
 * ---------------------------------------------------------------------------
 */

const OrderModel = require('../models/OrderModel');

const HomeController = {
  /**
   * GET /
   * Renders the homepage with the two entry points (patron / bartender).
   */
  index(req, res) {
    // Ask the MODEL for the live queue counts so the homepage tiles can show
    // the bartender how much work is waiting.
    const summary = OrderModel.getQueueSummary();

    // Hand the data to the VIEW.
    res.render('index', {
      title: 'The Osprey Lounge',
      activeNav: 'home',
      summary
    });
  }
};

module.exports = HomeController;
