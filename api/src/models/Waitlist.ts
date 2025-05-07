import { Schema, model } from "mongoose";

const waitlistEntrySchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  ipAddress: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Waitlist = model("Waitlist", waitlistEntrySchema);
