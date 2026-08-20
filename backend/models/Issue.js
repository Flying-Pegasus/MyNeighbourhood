import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  isConfirmed: { type: Boolean, required: true },
  uploadedProofUrl: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userRole: { type: String },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, default: "image" },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const resolutionEvidenceSchema = new mongoose.Schema({
  imageUrl: { type: String },
  notes: { type: String },
  resolvedAt: { type: Date, default: Date.now }
}, { _id: false });

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium"
  },
  status: {
    type: String,
    enum: ["Reported", "Verified", "Assigned", "In Progress", "Resolved", "Closed"],
    default: "Reported"
  },
  latitude: { type: Number, default: 45.5200 },
  longitude: { type: Number, default: -122.6800 },
  address: { type: String, default: "City Center" },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reporterName: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  assignedOfficerId: { type: String },
  assignedOfficerName: { type: String },
  media: [mediaSchema],
  verifications: [verificationSchema],
  comments: [commentSchema],
  trustScore: { type: Number, default: 75 },
  resolutionEvidence: resolutionEvidenceSchema,

  // SLA tracking (Feature C)
  slaDeadline: { type: Date },
  slaBreach: { type: Boolean, default: false },

  // Sentiment tracking (Feature D)
  rejectionSentiment: { type: String },

  // Auto-escalation flag (Feature B)
  autoEscalated: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-calculate SLA deadline on save
issueSchema.pre("save", function (next) {
  if (this.isNew && !this.slaDeadline) {
    const hours = {
      "Critical": 4,
      "High": 24,
      "Medium": 72,
      "Low": 168
    };
    const slaHours = hours[this.severity] || 72;
    this.slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);
  }
  next();
});

issueSchema.set("toJSON", { virtuals: true });
issueSchema.set("toObject", { virtuals: true });

const Issue = mongoose.model("Issue", issueSchema);
export default Issue;
