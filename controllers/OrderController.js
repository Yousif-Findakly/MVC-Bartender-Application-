/**
 * controllers/OrderController.js
 * ---------------------------------------------------------------------------
 * CONTROLLER - Cocktail orders.
 *
 * The assignment calls for "a controller to handle cocktail order-related
 * actions (create, edit, and view)". Those three actions map to:
 *
 *   CREATE -> newOrder()  (GET  /order/new)      + create() (POST /order)
 *   EDIT   -> editOrder() (GET  /order/:id/edit) + update() (POST /order/:id)
 *             markReady() (POST /queue/:id/ready) - the bartender's edit
 *   VIEW   -> view()      (GET  /order/:id)      + viewQueue() (GET /queue)
 *
 * Steps 6-10 of the request flow live in this file. Again: the controller
 * only routes work. Every database read/write happens inside the models.
 * ---------------------------------------------------------------------------
 */

const CocktailModel = require('../models/CocktailModel');
const OrderModel = require('../models/OrderModel');

const OrderController = {
  /* ----------------------------------------------------------------- CREATE */

  /**
   * GET /order/new?cocktail_id=3
   * Step 6: the patron has reviewed the menu and wants to place an order.
   * Shows the order form, pre-selected to the cocktail they clicked.
   */
  newOrder(req, res) {
    // Ask the MODEL for the menu so the form's drop-down can be populated.
    const cocktails = CocktailModel.getAvailableCocktails();
    const selected = CocktailModel.getCocktailById(req.query.cocktail_id);

    res.render('order-form', {
      title: 'Place an Order',
      activeNav: 'menu',
      cocktails,
      formatPrice: CocktailModel.formatPrice,
      errors: [],
      orderId: null,
      form: {
        cocktail_id: selected ? selected.cocktail_id : '',
        patron_name: '',
        table_number: '',
        quantity: 1,
        special_instructions: ''
      }
    });
  },

  /**
   * POST /order
   * Step 7: "The controller examines the user request and the parameters and
   * calls the model asking it to store cocktail order information in the
   * database."
   */
  create(req, res) {
    const form = {
      cocktail_id: req.body.cocktail_id,
      patron_name: req.body.patron_name,
      table_number: req.body.table_number,
      quantity: req.body.quantity,
      special_instructions: req.body.special_instructions
    };

    // The MODEL owns the rules -- the controller just asks whether they passed.
    const errors = OrderModel.validate(form);

    if (errors.length > 0) {
      // Re-render the form VIEW with the messages and the user's own input.
      return res.status(400).render('order-form', {
        title: 'Place an Order',
        activeNav: 'menu',
        cocktails: CocktailModel.getAvailableCocktails(),
        formatPrice: CocktailModel.formatPrice,
        errors,
        orderId: null,
        form
      });
    }

    // Hand the write to the MODEL, which stores it in the database.
    const orderId = OrderModel.createOrder(form);

    // Redirect to the confirmation view (POST-then-redirect keeps a browser
    // refresh from submitting the same order twice).
    return res.redirect(`/order/${orderId}`);
  },

  /* ------------------------------------------------------------------- EDIT */

  /**
   * GET /order/:id/edit
   * The patron wants to change an order they already sent. Shows the same form
   * as CREATE, pre-filled from the database, pointed at the update action.
   */
  editOrder(req, res, next) {
    const order = OrderModel.getOrderById(req.params.id);

    if (!order) {
      return next(); // 404 handler in server.js
    }

    // Business rule lives in the MODEL: a poured drink can no longer be changed.
    if (!OrderModel.isEditable(order)) {
      return res.redirect(`/order/${order.order_id}`);
    }

    return res.render('order-form', {
      title: `Edit Order #${order.order_id}`,
      activeNav: 'menu',
      cocktails: CocktailModel.getAvailableCocktails(),
      formatPrice: CocktailModel.formatPrice,
      errors: [],
      orderId: order.order_id,
      form: {
        cocktail_id: order.cocktail_id,
        patron_name: order.patron_name,
        table_number: order.table_number,
        quantity: order.quantity,
        special_instructions: order.special_instructions || ''
      }
    });
  },

  /**
   * POST /order/:id
   * Applies the patron's changes. Mirrors create(): the MODEL validates, the
   * MODEL writes, the controller only picks the response.
   */
  update(req, res, next) {
    const order = OrderModel.getOrderById(req.params.id);

    if (!order) {
      return next();
    }

    const form = {
      cocktail_id: req.body.cocktail_id,
      patron_name: req.body.patron_name,
      table_number: req.body.table_number,
      quantity: req.body.quantity,
      special_instructions: req.body.special_instructions
    };

    const errors = OrderModel.validate(form);

    if (errors.length > 0) {
      return res.status(400).render('order-form', {
        title: `Edit Order #${order.order_id}`,
        activeNav: 'menu',
        cocktails: CocktailModel.getAvailableCocktails(),
        formatPrice: CocktailModel.formatPrice,
        errors,
        orderId: order.order_id,
        form
      });
    }

    // Returns false if the bartender marked it ready while the form was open.
    const changed = OrderModel.updateOrder(order.order_id, form);

    return res.redirect(changed ? `/order/${order.order_id}?updated=1` : `/order/${order.order_id}`);
  },

  /* ------------------------------------------------------------------- VIEW */

  /**
   * GET /order/:id
   * Confirmation screen for the patron: what was ordered and its live status.
   */
  view(req, res, next) {
    const order = OrderModel.getOrderById(req.params.id);

    if (!order) {
      return next(); // falls through to the 404 handler in server.js
    }

    return res.render('order-confirmation', {
      title: `Order #${order.order_id}`,
      activeNav: 'menu',
      order,
      formatPrice: CocktailModel.formatPrice,
      STATUS: OrderModel.STATUS,
      canEdit: OrderModel.isEditable(order),
      notice: req.query.updated ? 'Your changes were sent to the bar.' : null
    });
  },

  /**
   * GET /queue
   * Steps 8-10: "When the bartender chooses the order queue option in the
   * index page, the controller examines the user request and calls the model
   * asking it to return the list of cocktail orders. The model is responsible
   * for getting cocktail order information from the database. The controller
   * will use the appropriate view to display cocktail orders to the user."
   */
  viewQueue(req, res) {
    const orders = OrderModel.getOrderQueue(); // 8 + 9: controller -> model -> DB
    const summary = OrderModel.getQueueSummary();

    // 10: the controller selects the VIEW for the bartender.
    res.render('queue', {
      title: 'Bartender Order Queue',
      activeNav: 'queue',
      orders,
      summary,
      STATUS: OrderModel.STATUS,
      formatPrice: CocktailModel.formatPrice,
      notice: req.query.ready ? `Order #${req.query.ready} is ready for pickup.` : null
    });
  },

  /* ------------------------------------------------------------------- EDIT */

  /**
   * POST /queue/:id/ready
   * The bartender has prepared the drink and sets it out for the server to
   * pick up. This is the "edit" action on an order.
   */
  markReady(req, res) {
    const changed = OrderModel.markReadyForPickup(req.params.id);

    // Redirect back to the queue view either way; the flag drives the banner.
    return res.redirect(changed ? `/queue?ready=${req.params.id}` : '/queue');
  }
};

module.exports = OrderController;
