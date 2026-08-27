# MVC Bartender Application

**CIS 4327 – IS Senior Project I** · Individual Activity

An online bartender application built on the **Model–View–Controller** pattern.
Bar patrons browse the cocktail menu and place an order; the bartender works the
order queue and sets each drink out for the server to pick up.

**Stack:** Node.js · Express 4 · EJS · SQLite (better-sqlite3)

---

## Running it

```bash
npm install
npm start
```

Then open <http://localhost:3000>.

The SQLite database is created and seeded with the cocktail menu automatically
on first start, so no database setup is required.

| Command | What it does |
| --- | --- |
| `npm start` | Runs the server on port 3000 |
| `npm run dev` | Same, with auto-restart on file changes |
| `npm run reset-db` | Rebuilds the database: fresh menu, empty order queue |

---

## How the MVC pattern is applied

The dependency rule this project holds to: **controllers never write SQL, models
never render HTML, views never query the database.**

```
Browser → routes/index.js → Controller → Model → SQLite
                                ↓
                              View (EJS) → HTML
```

### Models — data and business logic

| File | Responsibility |
| --- | --- |
| [`models/CocktailModel.js`](models/CocktailModel.js) | Reads the cocktail menu; price formatting; availability rules |
| [`models/OrderModel.js`](models/OrderModel.js) | Every read/write on the `orders` table, order validation, and the status rules |

All SQL in the application lives in these two files. `OrderModel` also owns the
rules that are *not* obvious from the schema — an order must be for an available
cocktail, quantity is 1–6, and an order can only be edited or marked ready while
it is still `Queued`.

### Controllers — receive the request, pick the response

| File | Actions |
| --- | --- |
| [`controllers/HomeController.js`](controllers/HomeController.js) | `index` — the homepage |
| [`controllers/MenuController.js`](controllers/MenuController.js) | `index` — the cocktail menu |
| [`controllers/OrderController.js`](controllers/OrderController.js) | `newOrder`, `create`, `editOrder`, `update`, `view`, `viewQueue`, `markReady` |

The assignment asks for a controller handling order-related **create, edit, and
view** actions. In `OrderController` those are:

- **Create** — `newOrder()` renders the form, `create()` validates and stores it.
- **Edit** — `editOrder()` / `update()` let a patron change a ticket that is
  still queued; `markReady()` is the bartender's edit, moving an order to
  *Ready for Pickup*.
- **View** — `view()` shows a single order, `viewQueue()` shows the full queue.

### Views — display only

`views/index.ejs`, `menu.ejs`, `order-form.ejs`, `order-confirmation.ejs`,
`queue.ejs`, `error.ejs`, plus shared `partials/`. `order-form.ejs` is shared by
the create and edit actions, driven by whether an `orderId` was passed in.

---

## Request flow (as specified in the assignment)

| # | Step | Where it happens |
| --- | --- | --- |
| 1 | Index page with patron and bartender entry points | `GET /` → `HomeController.index` → `index.ejs` |
| 2 | Controller receives the GET/POST request | `routes/index.js` |
| 3 | Controller asks the model for the bar menu | `MenuController.index` |
| 4 | Model gets menu information from the database | `CocktailModel.getAvailableCocktails()` |
| 5 | Controller uses a view to display the menu | `menu.ejs` |
| 6 | Patron reviews the menu and places an order | `GET /order/new` → `order-form.ejs` |
| 7 | Controller examines the parameters; model stores the order | `POST /order` → `OrderModel.createOrder()` |
| 8 | Bartender opens the queue; controller asks the model for orders | `GET /queue` → `OrderController.viewQueue` |
| 9 | Model gets order information from the database | `OrderModel.getOrderQueue()` |
| 10 | Controller uses a view to display the orders | `queue.ejs` |

## Routes

| Method | Path | Action |
| --- | --- | --- |
| GET | `/` | Homepage |
| GET | `/menu` | Cocktail menu |
| GET | `/order/new` | Order form |
| POST | `/order` | Create an order |
| GET | `/order/:id` | Order confirmation and live status |
| GET | `/order/:id/edit` | Edit form for a queued order |
| POST | `/order/:id` | Save changes to an order |
| GET | `/queue` | Bartender order queue |
| POST | `/queue/:id/ready` | Mark an order ready for pickup |

## Database

Two tables, created and seeded on start-up by
[`config/database.js`](config/database.js):

- **`cocktails`** — the bar menu (`name`, `description`, `ingredients`, `glass`, `price`, `is_available`)
- **`orders`** — the order queue (`cocktail_id` → `cocktails`, `patron_name`, `table_number`, `quantity`, `special_instructions`, `status`, `placed_at`, `ready_at`)

An order is `Queued` when placed and becomes `Ready for Pickup` once the
bartender has prepared it.
