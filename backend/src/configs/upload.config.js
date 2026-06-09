const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'topup24h-uploads',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    },
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.error(`[UPLOAD REJECTED] Invalid MIME type: ${file.mimetype} for file: ${file.originalname}`);
        cb(new Error('Chỉ chấp nhận file ảnh định dạng JPG, PNG, GIF hoặc WebP'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

const secureUpload = (fieldName) => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err) {
                console.error('[UPLOAD ERROR]', err.message);
                return res.status(400).json({ status: false, message: err.message });
            }
            next();
        });
    };
};

module.exports = upload;
module.exports.secureUpload = secureUpload;