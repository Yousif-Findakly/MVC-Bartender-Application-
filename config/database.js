/**
 * config/database.js
 * ---------------------------------------------------------------------------
 * Database connection and schema bootstrap.
 *
 * MVC NOTE: Nothing in this file is a Model. This file only opens the physical
 * connection to the database and guarantees the schema exists. The Models
 * (models/CocktailModel.js, models/OrderModel.js) are the only files allowed to
 * issue queries against this connection. Controllers never import this file.
 * ---------------------------------------------------------------------------
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// The SQLite database file lives in /data so it is easy to find and easy to delete.
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'bartender.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_FILE);

// Enforce foreign keys so an order can never point at a cocktail that is not on the menu.
db.pragma('foreign_keys = ON');

/**
 * Creates the two tables the application needs, if they do not already exist.
 *
 *   cocktails  -> the bar menu (read by patrons, read by the order form)
 *   orders     -> the cocktail order queue (written by patrons, updated by bartenders)
 */
function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cocktails (
      cocktail_id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL UNIQUE,
      description   TEXT    NOT NULL,
      ingredients   TEXT    NOT NULL,
      glass         TEXT    NOT NULL,
      price         REAL    NOT NULL,
      is_available  INTEGER NOT NULL DEFAULT 1
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id             INTEGER PRIMARY KEY AUTOINCREMENT,
      cocktail_id          INTEGER NOT NULL,
      patron_name          TEXT    NOT NULL,
      table_number         TEXT    NOT NULL,
      quantity             INTEGER NOT NULL DEFAULT 1,
      special_instructions TEXT,
      status               TEXT    NOT NULL DEFAULT 'Queued',
      placed_at            TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      ready_at             TEXT,
      FOREIGN KEY (cocktail_id) REFERENCES cocktails (cocktail_id)
    );
  `);
}

/**
 * Inserts the starting cocktail menu the first time the application runs.
 * Running it again is harmless -- it only seeds when the table is empty.
 */
function seedMenu() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM cocktails').get();
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO cocktails (name, description, ingredients, glass, price, is_available)
    VALUES (@name, @description, @ingredients, @glass, @price, 1)
  `);

  const menu = [
    {
      name: 'The Treaty Oak',
      description: 'Bourbon stirred over toasted oak, name for the 250 year old live oak in Jacksonville',
      ingredients: 'Bourbon, toasted oak demerara syrup, black walnut bitters, orange peel',
      glass: 'Rocks',
      price: 13.0
    },
    {
      name: 'Datil Pepper Margarita',
      description: 'Blanco tequila with datil pepper syrup and the sweet hot pepper grown nowehere but North Florida',
      ingredients: 'Blanco tequila datil pepper syrup, lime juice, triple sec, chili salt rim',
      glass: 'Rocks',
      price: 12.5
    },
    {
      name: 'Bold City Mule',
      description: 'The Bold New City of the South in a copper mug: sharp ginger, bright lime',
      ingredients: 'Vodka, ginger beer, lime juice, candied ginger',
      glass: 'Copper Mug',
      price: 11.5
    },
    {
      name: 'Mayport Bloody Mary',
      description: 'Built on datil hot sauce and finished with a poached Mayport shrimp on the rim',
      ingredients: 'Vodka, tomato juice, datil hot sauce, horseradish lemon, Old Bay rim, Mayport shrimp',
      glass: 'Pint',
      price: 11.0
    },
    {
      name: 'Bolt Bean Expresso',
      description: 'Loca cold brew shaken with vodka to a velvet foam.',
      ingredients: 'Vodka, Bold Bean cold brew, scoffee liqueur, demerara syrup',
      glass: 'Martini',
      price: 14.5
    },
    {
      name: 'San Marco Lion',
      description: 'Bitter, regal and stirred after the bronze lions standing watch over the square',
      ingredients: 'Gin, Campari, sweet vermouth, orange peel',
      glass: 'Rocks',
      price: 13.5
    },
    {
      name: "Friendship Fountain",
      description: 'Lit up blue over the Southbank, with a lemon elderflower finish.',
      ingredients: 'Gin, elderflower liqueur, lemon juice, simple syrup, soda water',
      glass: 'Highball',
      price: 12.0
    },
    {
      name: 'Riverside Spritz',
      description: 'The Avondale porch drink: low, bubbly and bitter-orange.',
      ingredients: 'Aperol, prosecco, soda water, orange slice',
      glass: 'Wine',
      price: 12.0
    },
    {
      name: 'Springfield Sour',
      description: 'Rye and lemon under a silky cap, as historic as the district it is named for.',
      ingredients: 'Rye whiskey, lemon juice, cane syrup, egg white, angostura bitters',
      glass: 'Coupe',
      price: 13.0
    },
    {
      name: 'Dames Point',
      description: 'Tall and cable-strung: grapefruit and rosemary stretched over soda.',
      ingredients: 'Gin, grapefruit juice, lime juice, rosemary syrup, soda water',
      glass: 'Collins',
      price: 12.5
    },
    {
      name: 'Duval Gold',
      description: 'Teal-and-gold game day in a glass — mango, lime and a tajin rim.',
      ingredients: 'Reposado tequila, mango puree, lime juice, turmeric honey syrup, tajin rim',
      glass: 'Coupe',
      price: 13.0
    },
    {
      name: 'Southbank Sweet Tea',
      description: 'Bourbon dropped into cold sweet tea with lemon and mint. Served in a mason jar.',
      ingredients: 'Bourbon, sweet tea, lemon juice, mint',
      glass: 'Mason Jar',
      price: 11.0
    },
    {
      name: 'Neptune Beach Breeze',
      description: 'Rum, pineapple and coconut with a grate of nutmeg — three blocks from the water.',
      ingredients: 'White rum, pineapple juice, coconut cream, lime juice, nutmeg',
      glass: 'Highball',
      price: 11.5
    },
    {
      name: 'Cummer Garden',
      description: 'Cucumber, mint and elderflower, poured out of the riverfront gardens.',
      ingredients: 'Gin, cucumber, lime juice, mint, elderflower liqueur',
      glass: 'Coupe',
      price: 12.5
    },
    {
      name: 'Little Talbot Cooler',
      description: 'Zero-proof: cucumber and mint over crushed ice, cool as the north shore.',
      ingredients: 'Cucumber, mint, lime juice, honey syrup, soda water',
      glass: 'Highball',
      price: 7.5
    },
    {
      name: 'Trout River Punch',
      description: 'Zero-proof hibiscus and citrus punch with a ginger beer float.',
      ingredients: 'Hibiscus tea, orange juice, pineapple juice, lime juice, ginger beer',
      glass: 'Punch',
      price: 7.0
    }

  
  ];

  const seedAll = db.transaction((rows) => rows.forEach((row) => insert.run(row)));
  seedAll(menu);
}

/** Called once from server.js at start-up. */
function initialize() {
  createSchema();
  seedMenu();
  return db;
}


module.exports = { db, initialize, DB_FILE };
