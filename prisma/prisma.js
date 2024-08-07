const { PrismaClient } = require('@prisma/client');
const { filesize } = require('filesize');

module.exports = new PrismaClient().$extends({
    result: {
        file: {
            sizeFormatted: {
                needs: {size: true},
                compute(file) {
                    return filesize(file.size);
                }
            }
        },
        folder: {
            totalSize: {
                needs: {files: true},
                compute(folder) {
                    return filesize(Math.round(folder.files.reduce((sum, file) => sum + file.size, 0)));
                }
            }
        }
    }
});