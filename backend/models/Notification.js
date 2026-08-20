import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["info", "success", "warning", "badge", "sla_breach"], default: "info" },
  isRead: { type: Boolean, default: false },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" }
}, { timestamps: true });

notificationSchema.set("toJSON", { virtuals: true });
notificationSchema.set("toObject", { virtuals: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
