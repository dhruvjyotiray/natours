const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const multer = require("multer");
const sharp = require("sharp");

const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("../controllers/handlerFactory");

exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);
exports.createTour = createOne(Tour);
exports.getTour = getOne(Tour, {
  path: "reviews",
  select: "-__v",
});

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Error. Please upload only images.", 404), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //1. Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2. Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );

  next();
});

exports.getAllTours = getAll(Tour);

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,difficulty";
  next();
};

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4 } },
      },
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          numTours: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      // {
      //   $match: { _id: { $ne: "EASY" } },
      // },
    ]);

    res.status(200).json({
      status: "success",
      data: { stats },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = +req.params.year;
    const plan = await Tour.aggregate([
      {
        $unwind: "$startDates",
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTourStarts: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      {
        $addFields: { month: "$_id" },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 3,
      },
    ]);

    res.status(200).json({
      status: "success",
      data: { plan },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

//tours/tours-within/100/center/22.475030, 88.359597/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat, lng",
        500
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: { data: tours },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const multiplier = unit === "mi" ? 0.00062137 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat, lng",
        500
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    results: distances.length,
    data: { data: distances },
  });
});

// exports.createTour = async (req, res) => {
//   try {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       status: "success",
//       data: { tour: newTour },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: "fail",
//       message: err.message,
//     });
//   }
// };

// exports.getAllTours = async (req, res) => {
//   try {
//BUILD QUERY
//1A. Filtering
// const queryObj = { ...req.query };
// const excludedFields = ["page", "sort", "limit", "fields"];
// excludedFields.forEach((el) => {
//   return delete queryObj[el];
// });

// //1B. Advanced filtering
// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
// console.log(JSON.parse(queryStr));

// let query = Tour.find(JSON.parse(queryStr));

//2. SORTING
// if (req.query.sort) {
//   const sortBy = req.query.sort.replace(/,/g, " ");
//   query = query.sort(sortBy);
// } else {
//   query = query.sort("-_id");
// }

//3. FIELD LIMITING
// if (req.query.fields) {
//   const fields = req.query.fields.replace(/,/g, " ");
//   query = query.select(fields);
// } else {
//   query = query.select("-__v");
// }

//4. PAGINATION
// const page = +req.query.page || 1;
// const limit = +req.query.limit || 100;
// const skip = (page - 1) * limit;
// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//   const numTours = await Tour.countDocuments();
//   if (skip >= numTours) throw new Error("This page does not exist!");
// }
//EXECUTE QUERY
// const features = new APIFeatures(Tour.find(), req.query)
//   .filter()
//   .sort()
//   .limitFields()
//   .paginate();
// const tours = await features.query.exec();

//SEND RESPONSE
//     res.status(200).json({
//       status: "success",
//       results: tours.length,
//       data: { tours: tours },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: "fail",
//       message: err.message,
//     });
//   }
// };

// exports.getTour = async (req, res) => {
//   try {
//     const tour = await Tour.findById(req.params.id).populate({
//       path: "reviews",
//       select: "-__v",
//     });

//     if (tour) {
//       res.status(200).json({ status: "success", data: { tour } });
//     } else {
//       res.status(404).json({ status: "fail", message: "Tour not found" });
//     }
//   } catch (err) {
//     console.error("Error in getTour:", err);
//     res.status(400).json({ status: "fail", data: err.message });
//   }
// };

// exports.updateTour = async (req, res) => {
//   try {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({
//       status: "success",
//       data: { tour },
//     });
//   } catch (err) {
//     res.status(400).json({ status: "fail", data: err });
//   }
// };

// exports.deleteTour = async (req, res) => {
//   try {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     res.status(200).json({
//       status: "success",
//       data: { tour },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: "fail",
//       data: "No file found",
//     });
//   }
// };
