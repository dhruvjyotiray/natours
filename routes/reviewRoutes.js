const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require("../controllers/reviewController");

const { protect, restrictTo } = require("../controllers/authController");

router.use(protect);

router
  .route("/")
  .get(getAllReviews)
  .post(restrictTo("user"), setTourUserIds, createReview);

router.route("/:id").get(getReview);

router.use(restrictTo("admin", "user"));

router.route("/:id").delete(deleteReview);
router.route("/:id").patch(updateReview);

module.exports = router;
