import { Request, Response, NextFunction } from "express";
import { Waitlist } from "../models/Waitlist";
import validator from "validator";

export const addToWaitlist = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const { email } = req.body;

    if (!email || typeof email !== "string" || !ip) {
      return res
        .status(400)
        .json({ message: "Email and IP address are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const exists = await Waitlist.findOne({
      where: { email: normalizedEmail },
    });
    if (exists) {
      return res
        .status(409)
        .json({ message: "You're already on the waitlist." });
    }

    await Waitlist.create({
      email: normalizedEmail,
      ipAddress: String(ip),
      createdAt: new Date(),
    });

    return res
      .status(201)
      .json({ message: "Successfully added to the waitlist." });
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res
        .status(409)
        .json({ message: "You're already on the waitlist." });
    }

    console.error("Waitlist error:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};
