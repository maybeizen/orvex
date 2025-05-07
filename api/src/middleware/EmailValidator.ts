import { Request, Response, NextFunction } from "express";
import { Waitlist } from "../models/Waitlist";

export const checkDuplicateEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).json({ message: "A valid email is required." });
    return;
  }

  try {
    const exists = await Waitlist.findOne({ where: { email } });

    if (exists) {
      res
        .status(409)
        .json({ message: "This email is already on the waitlist." });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};
