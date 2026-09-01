import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import HANDLERS from './handlers/index.js';
import errorMiddleware from './middleware/error.js';

const app = express();
connectDB();

const Port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use('/', HANDLERS);
app.use(errorMiddleware);

app.listen(Port, () => {
    console.log("Student cms server is running on " + Port);
});