import { Router } from "express";
import { addToWaitlist } from "../controllers/WaitlistController";
import { checkDuplicateEmail } from "../middleware/EmailValidator";
import { waitlistRateLimiter } from "../middleware/RateLimit";

const waitlistRouter: Router = Router();

waitlistRouter.post(
  "/waitlist",
  waitlistRateLimiter,
  checkDuplicateEmail,
  addToWaitlist
);

export default waitlistRouter;
