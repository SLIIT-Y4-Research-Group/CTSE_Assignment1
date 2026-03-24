const multer = require("multer");

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.",
        ),
      );
    }

    cb(null, true);
  },
});

function uploadBannerMiddleware(req, res, next) {
  upload.single("banner")(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "Banner image must be 5MB or smaller" });
    }

    return res.status(400).json({
      message: err.message || "Banner upload failed",
    });
  });
}

module.exports = { uploadBannerMiddleware };
