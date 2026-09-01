function errorHandler(err, req, res, next) {
  if (err.code === "ECONNREFUSED" && err.port === 5432) {
    console.log(
      "The database connection was refused.  Is your database service running?",
    );
  }

  console.error(err);

  res.status(500).json({
    message: "Internal Server Error",
  });
}

module.exports = errorHandler;
