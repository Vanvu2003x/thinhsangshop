const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
    try {
        if (!filePath) return;

        const rootDir = path.resolve(__dirname, '..', '..');
        const absolutePath = path.join(rootDir, filePath);

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
        } else {

            const uploadPath = path.join(rootDir, 'src', 'uploads', path.basename(filePath));
            if (fs.existsSync(uploadPath)) {
                fs.unlinkSync(uploadPath);
            }
        }
    } catch (error) {
        console.error(`[FileUtil] Error deleting file: ${filePath}`, error);
    }
};

module.exports = {
    deleteFile
};