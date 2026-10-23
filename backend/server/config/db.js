import mongoose from 'mongoose';
import colors from 'colors';

/**
 * Ye function MongoDB database ke sath connection establish karta hai Mongoose use karke.
 * .env file se MONGO_URI uthata hai aur database se connect karta hai.
 * Agar connection successful raha toh success log deta hai, fail hone par error dikhata hai.
 */
const connectDB = async () => {
  try {
    // .env file se MONGO_URI leke MongoDB ke sath connect kar rahe hain
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Database connection successful hone par host/name console me print hoga
    console.log(`[MongoDB Connected]: Database successfully connected -> ${conn.connection.name}`.bgGreen.black);
  } catch (error) {
    // Agar connection me koi issue aaya toh console me error dikhayega aur server exit ho jayega
    console.log(`[MongoDB Connection Failed]: Database connect nahi ho paya -> ${error.message}`.bgRed.white);
    process.exit(1);
  }
};

export default connectDB;