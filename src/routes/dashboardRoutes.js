const router = require("express").Router();
const c = require("../controllers/DashboardController");
const { protect } = require("../middleware/authMiddleware");
router.use(protect);
router.get("/cards", c.cards);
router.get("/recent", c.recent);
module.exports = router;
