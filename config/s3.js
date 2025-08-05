import pkg from 'aws-sdk';
const { S3 } = pkg;
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET } from './env.js';

// Log AWS configuration (without sensitive data)
console.log('AWS Configuration:', {
    hasAccessKey: !!AWS_ACCESS_KEY_ID,
    hasSecretKey: !!AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
    bucket: AWS_S3_BUCKET
});
// Validate AWS configuration
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
    throw new Error('AWS credentials are not properly configured');
}

const s3 = new S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION
});

export const uploadToS3 = async (fileBuffer, fileName, contentType = 'image/png') => {
    if (!AWS_S3_BUCKET) {
        throw new Error('AWS_S3_BUCKET is not configured');
    }

    const params = {
        Bucket: AWS_S3_BUCKET,
        Key: `qr-codes/${fileName}`,
        Body: fileBuffer,
        ContentType: contentType
        // Removed ACL setting as the bucket does not allow ACLs
        // Access control should be managed through bucket policies instead
    };
    
    console.log('Uploading to S3 with params:', {
        Bucket: params.Bucket,
        Key: params.Key,
        ContentType: params.ContentType,
        ACL: params.ACL
    });

    try {
        if (!fileBuffer) {
            throw new Error('File buffer is empty or invalid');
        }
        
        const result = await s3.upload(params).promise();
        console.log('S3 upload successful:', {
            url: result.Location,
            key: result.Key,
            bucket: result.Bucket
        });
        return result.Location; // Returns the public URL of the uploaded file
    } catch (error) {
        console.error('Error uploading to S3:', {
            error: error.message,
            code: error.code,
            statusCode: error.statusCode,
            requestId: error.requestId,
            bucket: AWS_S3_BUCKET,
            fileName: fileName
        });
        throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
};

export const deleteFromS3 = async (fileName) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `qr-codes/${fileName}`
    };

    try {
        await s3.deleteObject(params).promise();
    } catch (error) {
        console.error('Error deleting from S3:', error);
        throw new Error('Failed to delete file from S3');
    }
};
