import mongoose from "mongoose";
import { hashPassword, verifyPassword } from "../utils/auth.js";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ["Citizen", "Officer", "Admin"], default: "Citizen" },
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  credibilityScore: { type: Number, default: 75, min: 0, max: 100 }
}, { timestamps: true });

userSchema.virtual("initials").get(function () {
  return this.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = hashPassword(this.password);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return verifyPassword(candidatePassword, this.password);
};

userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email: String(email).trim().toLowerCase() });
  if (!user) return null;

  const isMatch = user.comparePassword(password);
  if (!isMatch) return null;

  return user;
};

userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);
export default User;
