import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Allows cross-origin requests in production
  });

  return token;
};
