import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// Update CORS for production
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? process.env.FRONTEND_URL || true
    : "http://localhost:5173",
  credentials: true
};

// app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(cors(corsOptions));
app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies

app.use("/api/auth", authRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

// app.listen(PORT, () => {
// 	connectDB();
// 	console.log("Server is running on port: ", PORT);
// });

// For Vercel, we don't need app.listen in serverless functions
// if (process.env.NODE_ENV !== "production") {
//   app.listen(PORT, () => {
//     connectDB();
//     console.log("Server is running on port: ", PORT);
//   });
// } else {
//   connectDB();
// }

connectDB();
app.listen(PORT, () => {
  console.log("Server is running on port: ", PORT);
});
