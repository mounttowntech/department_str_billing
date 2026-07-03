const router = require("express").Router();
const c = require("../controllers/DashboardController");

router.get("/cards", c.cards);
router.get("/recent", c.recent);
module.exports = router;
