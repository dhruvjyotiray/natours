const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Booking = require("../models/bookingModel");

exports.getOverview = catchAsync(async (req, res, next) => {
  //1. Get tour data from collection
  const tours = await Tour.find();
  //2. Build template

  //3. Render that template using the tour data from step-1
  res.status(200).render("overview", {
    title: "All Tours",
    tours: tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1. Get the data for the requested tour (incl. reviews & guides)
  const { slug } = req.params;
  const tour = await Tour.findOne({ slug: slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  if (!tour) {
    return next(new AppError("There is no tour with that name", 404));
  }
  //2. Build template
  //3. Render that template using the tour data from step-1
  res.status(200).render("tour", {
    title: tour.name,
    tour: tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
};

exports.getAccount = (req, res) => {
  const user = req.user;
  res.status(200).render("account", {
    title: "Your account",
    user: user,
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1. Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  //2. Find tours with the returned IDs
  const tourIds = bookings.map((booking) => {
    return booking.tour.id;
  });

  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render("overview", {
    title: "My tours",
    tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      email: req.body.email,
      name: req.body.name,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});
