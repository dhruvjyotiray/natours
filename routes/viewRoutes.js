const express = require("express");
const router = express.Router();

const { isLoggedIn, protect } = require("../controllers/authController");
const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  updateUserData,
  getMyTours,
  alerts
} = require("../controllers/viewsController");
// const { createBookingCheckout } = require("../controllers/bookingController");

router.use(alerts)

router.get("/", isLoggedIn, getOverview);
router.get("/tour/:slug", isLoggedIn, getTour);
router.get("/login", isLoggedIn, getLoginForm);
router.get("/me", protect, getAccount);
router.get("/my-tours", protect, getMyTours)

router.post("/submit-user-data", protect, updateUserData);

module.exports = router;
