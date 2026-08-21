import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["Citizen", "Officer", "Admin"], default: "Citizen" },
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  credibilityScore: { type: Number, default: 75, min: 0, max: 100 }
}, { timestamps: true });

// Virtual for initials
userSchema.virtual("initials").get(function () {
  return this.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);
export default User;
