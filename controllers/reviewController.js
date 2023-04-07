const Review = require("../models/reviewModel");
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll
} = require("../controllers/handlerFactory");

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next()
};

// exports.createReview = catchAsync(async (req, res, next) => {
//   //Allow nested routes
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user._id;
//   const review = await Review.create(req.body);

//   res.status(200).json({
//     status: "success",
//     data: { review },
//   });
// });

// exports.getAllReviews = catchAsync(async (req, res) => {
//   let filter = {};
//   if (req.params.tourId) {
//     filter = { tour: req.params.tourId };
//   }

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: "success",
//     results: reviews.length,
//     data: { reviews },
//   });
// });

exports.deleteReview = deleteOne(Review);
exports.updateReview = updateOne(Review);
exports.createReview = createOne(Review);
exports.getReview = getOne(Review)
exports.getAllReviews = getAll(Review)