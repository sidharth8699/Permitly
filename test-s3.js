import { uploadToS3 } from './config/s3.js';

// Create a small test buffer
const testBuffer = Buffer.from('test');

async function testS3Upload() {
    try {
        const result = await uploadToS3(testBuffer, 'test.txt', 'text/plain');
        console.log('S3 upload successful:', result);
    } catch (error) {
        console.error('S3 error details:', error);
    }
}

testS3Upload();
