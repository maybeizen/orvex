import rateLimit from "express-rate-limit";

export const waitlistRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests
  message: {
    message: "Too many waitlist submissions. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
