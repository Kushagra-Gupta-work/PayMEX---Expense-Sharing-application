This folder is where your Mongoose models (schemas) will live.

Example:

  // models/User.js
  import mongoose from "mongoose";

  const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
    },
    { timestamps: true }
  );

  export default mongoose.model("User", userSchema);
