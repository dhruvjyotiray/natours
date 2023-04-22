const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const appError = require("../utils/appError");
const multer = require("multer");
const sharp = require("sharp");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Error. Please upload only images.", 404), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.uploadUserPhoto = upload.single("photo");

const {
  deleteOne,
  updateOne,
  getOne,
  getAll,
} = require("../controllers/handlerFactory");
const AppError = require("../utils/appError");

const filterObj = (body, ...allowedUpdates) => {
  const filteredBody = {};
  for (let [key, val] of Object.entries(body)) {
    if (allowedUpdates.includes(key)) filteredBody[key] = body[key];
  }

  return filteredBody;
};

exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  // console.log(req.user);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //1. Create error if user POSTs password data

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new appError(
        "This route is not for password updates. Please use /updateMyPassword",
        400
      )
    );
  }

  //2. Update user document

  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: { updatedUser },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//Do NOT update passwords with this.
exports.getUser = getOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
exports.getAllUsers = getAll(User);

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   //EXECUTE QUERY
//   const users = await User.find();

//   //SEND RESPONSE
//   res.status(200).json({
//     status: "success",
//     results: users.length,
//     data: { users: users },
//   });
// });

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     //user-id-timestamp.jpg
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
