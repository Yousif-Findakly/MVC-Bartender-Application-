/**
 * models/OrderModel.js
 * ---------------------------------------------------------------------------
 * MODEL - Cocktail orders.
 *
 * Responsibility (per the assignment): store cocktail order information in the
 * database, and "getting cocktail order information from the database" so the
 * bartender's order queue can be displayed.
 *
 * This file owns every SQL statement that touches the `orders` table, the order
 * status rules, and the validation of a submitted order. Controllers call these
 * methods; they never write SQL and never decide what a valid order looks like.
 * ---------------------------------------------------------------------------
 */

const { db } = require('../config/database');
const CocktailModel = require('./CocktailModel');

// The only two states an order can be in, per the assignment: a patron places
// an order (Queued), the bartender prepares it and sets it out for the server
// to pick up (Ready for Pickup).
const STATUS = {
  QUEUED: 'Queued',
  READY: 'Ready for Pickup'
};

const OrderModel = {
  STATUS,

  /**
   * Validates a submitted order against the business rules.
   * Returns a list of human-readable error messages; empty means valid.
   * @param {Object} input raw form fields from the request body
   * @returns {string[]}
   */
  validate(input) {
    const errors = [];

    if (!CocktailModel.isOrderable(input.cocktail_id)) {
      errors.push('Please choose a cocktail that is currently on the menu.');
    }

    const name = String(input.patron_name || '').trim();
    if (name.length < 2) {
      errors.push('Please enter the name the order should be called under.');
    }

    const table = String(input.table_number || '').trim();
    if (table.length === 0) {
      errors.push('Please enter your table number or seat.');
    }

    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 6) {
      errors.push('Quantity must be a whole number between 1 and 6.');
    }

    return errors;
  },

  /**
   * Stores a new cocktail order. Called by OrderController when the patron
   * submits the order form (HTTP POST).
   * @param {Object} input validated form fields
   * @returns {number} the new order_id
   */
  createOrder(input) {
    const statement = db.prepare(`
      INSERT INTO orders
        (cocktail_id, patron_name, table_number, quantity, special_instructions, status)
      VALUES
        (@cocktail_id, @patron_name, @table_number, @quantity, @special_instructions, @status)
    `);

    const result = statement.run({
      cocktail_id: Number(input.cocktail_id),
      patron_name: String(input.patron_name).trim(),
      table_number: String(input.table_number).trim(),
      quantity: Number(input.quantity),
      special_instructions: String(input.special_instructions || '').trim() || null,
      status: STATUS.QUEUED
    });

    return result.lastInsertRowid;
  },

  /**
   * Business rule: an order may only be changed while it is still Queued.
   * Once the bartender has poured it, the ticket is locked.
   * @param {Object} order a row from getOrderById
   * @returns {boolean}
   */
  isEditable(order) {
    return Boolean(order) && order.status === STATUS.QUEUED;
  },

  /**
   * Updates an existing cocktail order. Called by OrderController.update when
   * the patron submits the edit form (HTTP POST). The status guard in the WHERE
   * clause means a race with the bartender cannot rewrite a poured drink.
   * @param {number|string} orderId
   * @param {Object} input validated form fields
   * @returns {boolean} true if the order changed
   */
  updateOrder(orderId, input) {
    const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) return false;

    const result = db
      .prepare(
        `UPDATE orders
            SET cocktail_id          = @cocktail_id,
                patron_name          = @patron_name,
                table_number         = @table_number,
                quantity             = @quantity,
                special_instructions = @special_instructions
          WHERE order_id = @order_id
            AND status   = @queued`
      )
      .run({
        order_id: id,
        cocktail_id: Number(input.cocktail_id),
        patron_name: String(input.patron_name).trim(),
        table_number: String(input.table_number).trim(),
        quantity: Number(input.quantity),
        special_instructions: String(input.special_instructions || '').trim() || null,
        queued: STATUS.QUEUED
      });

    return result.changes === 1;
  },

  /**
   * Returns one order joined with its cocktail, for the confirmation view.
   * @param {number|string} orderId
   * @returns {Object|undefined}
   */
  getOrderById(orderId) {
    const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) return undefined;

    return db
      .prepare(
        `SELECT o.order_id, o.cocktail_id, o.patron_name, o.table_number, o.quantity,
                o.special_instructions, o.status, o.placed_at, o.ready_at,
                c.name AS cocktail_name, c.glass, c.price
           FROM orders o
           JOIN cocktails c ON c.cocktail_id = o.cocktail_id
          WHERE o.order_id = ?`
      )
      .get(id);
  },

  /**
   * Returns the full order queue for the bartender, oldest first so the
   * bartender always works the earliest ticket at the top.
   * Called by OrderController.viewQueue.
   * @returns {Array<Object>}
   */
  getOrderQueue() {
    return db
      .prepare(
        `SELECT o.order_id, o.patron_name, o.table_number, o.quantity,
                o.special_instructions, o.status, o.placed_at, o.ready_at,
                c.name AS cocktail_name, c.ingredients, c.glass, c.price
           FROM orders o
           JOIN cocktails c ON c.cocktail_id = o.cocktail_id
          ORDER BY o.placed_at ASC, o.order_id ASC`
      )
      .all();
  },

  /**
   * Business rule: a bartender may only move an order from Queued to
   * Ready for Pickup, and only once. Returns true if the order changed.
   * Called by OrderController.markReady (HTTP POST).
   * @param {number|string} orderId
   * @returns {boolean}
   */
  markReadyForPickup(orderId) {
    const id = Number(orderId);
    if (!Number.isInteger(id) || id <= 0) return false;

    const result = db
      .prepare(
        `UPDATE orders
            SET status   = ?,
                ready_at = datetime('now','localtime')
          WHERE order_id = ?
            AND status   = ?`
      )
      .run(STATUS.READY, id, STATUS.QUEUED);

    return result.changes === 1;
  },

  /**
   * Small summary the queue view uses for its header counters.
   * @returns {{waiting: number, ready: number, total: number}}
   */
  getQueueSummary() {
    const row = db
      .prepare(
        `SELECT
            SUM(CASE WHEN status = @queued THEN 1 ELSE 0 END) AS waiting,
            SUM(CASE WHEN status = @ready  THEN 1 ELSE 0 END) AS ready,
            COUNT(*)                                          AS total
           FROM orders`
      )
      .get({ queued: STATUS.QUEUED, ready: STATUS.READY });

    return {
      waiting: row.waiting || 0,
      ready: row.ready || 0,
      total: row.total || 0
    };
  }
};

module.exports = OrderModel;
