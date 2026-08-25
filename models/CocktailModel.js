/**
 * models/CocktailModel.js
 * ---------------------------------------------------------------------------
 * MODEL - Cocktail menu.
 *
 * Responsibility (per the assignment): "The model is responsible for getting
 * menu information from the database."
 *
 * This file owns every SQL statement that touches the `cocktails` table, plus
 * the business rules about the menu (what counts as available, how a price is
 * formatted for display). Controllers ask this model for data; they never
 * write SQL themselves. Views never import this file.
 * ---------------------------------------------------------------------------
 */

const { db } = require('../config/database');

const CocktailModel = {
  /**
   * Returns every cocktail currently offered by the bar.
   * Used by MenuController to render the cocktail menu view.
   * @returns {Array<Object>} cocktail rows, alphabetized
   */
  getAvailableCocktails() {
    return db
      .prepare(
        `SELECT cocktail_id, name, description, ingredients, glass, price
           FROM cocktails
          WHERE is_available = 1
          ORDER BY name ASC`
      )
      .all();
  },

  /**
   * Returns a single cocktail by its primary key.
   * Used when a patron opens the order form for one specific drink, and to
   * validate that a submitted order refers to a real menu item.
   * @param {number|string} cocktailId
   * @returns {Object|undefined}
   */
  getCocktailById(cocktailId) {
    const id = Number(cocktailId);
    if (!Number.isInteger(id) || id <= 0) return undefined;

    return db
      .prepare(
        `SELECT cocktail_id, name, description, ingredients, glass, price, is_available
           FROM cocktails
          WHERE cocktail_id = ?`
      )
      .get(id);
  },

  /**
   * Business rule: a cocktail can be ordered only if it exists AND is flagged
   * available. The controller calls this before asking OrderModel to store an
   * order, so the rule lives in the model layer -- not in the controller.
   * @param {number|string} cocktailId
   * @returns {boolean}
   */
  isOrderable(cocktailId) {
    const cocktail = this.getCocktailById(cocktailId);
    return Boolean(cocktail && cocktail.is_available === 1);
  },

  /**
   * Presentation helper kept with the data it describes (e.g. 13 -> "$13.00").
   * @param {number} price
   * @returns {string}
   */
  formatPrice(price) {
    return `$${Number(price).toFixed(2)}`;
  }
};

module.exports = CocktailModel;
