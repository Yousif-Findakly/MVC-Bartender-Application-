/**
 * controllers/MenuController.js
 * ---------------------------------------------------------------------------
 * CONTROLLER - Cocktail menu.
 *
 * Steps 2-5 of the request flow:
 *   2. A controller receives the user request as an HTTP GET request.
 *   3. The controller examines the request and calls the MODEL asking it to
 *      return the cocktail bar menu.
 *   4. The MODEL gets the menu information from the database.
 *   5. The controller uses the appropriate VIEW to display the menu data.
 * ---------------------------------------------------------------------------
 */

const CocktailModel = require('../models/CocktailModel');

const MenuController = {
  /**
   * GET /menu
   * Displays the cocktail menu to the patron.
   */
  index(req, res) {
    // 3 + 4: the controller asks the MODEL; the model talks to the database.
    const cocktails = CocktailModel.getAvailableCocktails();

    // 5: the controller picks the VIEW and passes it the model's data.
    res.render('menu', {
      title: 'Cocktail Menu',
      activeNav: 'menu',
      cocktails,
      formatPrice: CocktailModel.formatPrice
    });
  }
};

module.exports = MenuController;
