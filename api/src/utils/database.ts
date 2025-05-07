import "dotenv/config";
import mongoose, { type Mongoose, type ConnectOptions } from "mongoose";

interface ConnectionProps {
  uri: string;
  options?: ConnectOptions;
}

export class Database {
  constructor(private readonly props: ConnectionProps) {
    if (!props.uri) {
      throw new Error("MongoDB URI must be provided.");
    }
  }

  public async connect(): Promise<void> {
    try {
      await mongoose.connect(this.props.uri, this.props.options);
      console.log("MongoDB connected.");
    } catch (err) {
      console.error(
        "MongoDB connection failed:",
        err instanceof Error ? err.message : err
      );
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    } catch (err) {
      console.error(
        "MongoDB disconnection error:",
        err instanceof Error ? err.message : err
      );
    }
  }

  public get instance(): Mongoose {
    return mongoose;
  }
}

export default new Database({
  uri: process.env.MONGODB_URI!,
});
