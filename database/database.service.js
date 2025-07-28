import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const connectToDatabase = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        return prisma;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
};

export const disconnectFromDatabase = async () => {
    try {
        await prisma.$disconnect();
        console.log('Database disconnected successfully');
    } catch (error) {
        console.error('Error disconnecting from database:', error.message);
        throw error;
    }
};

export default prisma;
