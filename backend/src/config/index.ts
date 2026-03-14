import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const HOST_API_PORT = process.env.HOST_API_PORT;

export default {
    DATABASE_URL,
    HOST_API_PORT,
};