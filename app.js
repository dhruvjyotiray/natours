require("dotenv").config();
const express = require("express");
//Start express
const app = express();
const morgan = require("morgan");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const path = require("path");
const cookieParser = require("cookie-parser");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//GLOBAL MIDDLEWARESS
//Serving static files
app.use(express.static(path.join(__dirname, "public")));

//Set security for HTTP headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 1000 * 60 * 60,
  message: "Too many requests from this IP, please try again later!",
});

app.use("/api", limiter);

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");
const bookingRouter  = require("./routes/bookingRoutes")

//Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsAverage",
      "ratingsQuantity",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

app.use(compression())

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use("/", viewRouter);

app.use("/api/v1/tours", tourRouter);

app.use("/api/v1/users", userRouter);

app.use("/api/v1/reviews", reviewRouter);

app.use("/api/v1/bookings", bookingRouter)

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

// app.get("/", (req, res) => {
//   res.status(200).json({ message: "Hello from the server!", app: "Natours" });
// });

// app.post('/', (req, res) => {
//     res.send('You can post to this endpoint...')
// })

// 2: Route Handlers

// app.get("/api/v1/tours", getAllTours);
// app.get("/api/v1/tours/:id", getTour);
// app.post("/api/v1/tours", createTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

// 1: Middlewares
