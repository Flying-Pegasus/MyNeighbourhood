import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Issue from "../models/Issue.js";
import Department from "../models/Department.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import Prediction from "../models/Prediction.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/myneighbourhood";

async function insertSeedData() {
  // Clear existing data when running a full reset.
  await Promise.all([
    User.deleteMany({}),
    Issue.deleteMany({}),
    Department.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    Prediction.deleteMany({})
  ]);
  console.log("[Seed] Cleared existing collections");

  // --- Users ---
  const users = await User.insertMany([
    { name: "Alex Reed", email: "alex@civicpulse.ai", role: "Citizen", points: 145, badges: ["Local Reporter", "Neighborhood Guardian"], credibilityScore: 92 },
    { name: "Maria Santos", email: "maria@civicpulse.ai", role: "Citizen", points: 55, badges: ["Local Reporter"], credibilityScore: 85 },
    { name: "David Chen", email: "david@civicpulse.ai", role: "Citizen", points: 210, badges: ["Local Reporter", "Neighborhood Guardian", "Community Hero"], credibilityScore: 98 },
    { name: "Officer Marcus Vance", email: "marcus.vance@metro.gov", role: "Officer", points: 0, badges: [], credibilityScore: 100 },
    { name: "Director Sarah Jenkins", email: "sarah.jenkins@metro.gov", role: "Admin", points: 0, badges: [], credibilityScore: 100 }
  ]);
  console.log(`[Seed] Inserted ${users.length} users`);

  const [alex, maria, david, marcus, sarah] = users;

  // --- Departments with embedded officers ---
  const departments = await Department.insertMany([
    {
      name: "Road Maintenance Dept", code: "ROAD", officerCount: 3, officers: [
        { name: "Officer Marcus Vance", email: "marcus.vance@metro.gov", isAvailable: true },
        { name: "Officer James Park", email: "james.p@metro.gov", isAvailable: true }
      ]
    },
    {
      name: "Water and Sanitation Dept", code: "WATER", officerCount: 4, officers: [
        { name: "Officer Elena Rostova", email: "elena.r@metro.gov", isAvailable: true }
      ]
    },
    {
      name: "Public Lighting Division", code: "LIGHT", officerCount: 2, officers: [
        { name: "Officer Kenji Sato", email: "kenji.s@metro.gov", isAvailable: true }
      ]
    },
    {
      name: "Parks & Waste Management", code: "WASTE", officerCount: 5, officers: [
        { name: "Inspector Kenji Sato", email: "kenji.s@metro.gov", isAvailable: false }
      ]
    },
    { name: "Traffic and Safety Control", code: "TRAFFIC", officerCount: 3, officers: [] }
  ]);
  console.log(`[Seed] Inserted ${departments.length} departments`);

  const [roadDept, waterDept, lightDept, wasteDept] = departments;

  // --- Issues ---
  const issues = await Issue.insertMany([
    {
      title: "Extremely Deep Pothole on Pine Street Blvd",
      description: "A hazardous pothole has opened up in the middle of the street right opposite Metro Library. It's causing cars to swerve or suffer tyre damage. Needs urgent patching.",
      category: "Pothole",
      severity: "High",
      status: "Assigned",
      latitude: 45.5231, longitude: -122.6765,
      address: "1012 SW Pine St, Portland, OR",
      reporterId: alex._id,
      reporterName: "Alex Reed",
      departmentId: roadDept._id,
      assignedOfficerId: roadDept.officers[0]._id.toString(),
      assignedOfficerName: "Officer Marcus Vance",
      media: [{ url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop", type: "image" }],
      verifications: [
        { userId: maria._id, userName: "Maria Santos", isConfirmed: true, timestamp: new Date("2026-06-20T11:00:00Z") },
        { userId: david._id, userName: "David Chen", isConfirmed: true, timestamp: new Date("2026-06-20T12:15:00Z") }
      ],
      comments: [
        { userId: marcus._id, userName: "Officer Marcus Vance", userRole: "Officer", content: "Slight asphalt mixing delayed, scheduled repairs for tomorrow morning during low traffic.", timestamp: new Date("2026-06-21T14:00:00Z") }
      ],
      trustScore: 94,
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date("2026-06-20T09:30:00Z"),
      updatedAt: new Date("2026-06-21T14:00:00Z")
    },
    {
      title: "Major Main Water Pipeline Failure",
      description: "Huge streams of clean water erupting from the sidewalk, flooding the adjacent bicycle lanes and parking bays.",
      category: "Water Leakage",
      severity: "Critical",
      status: "In Progress",
      latitude: 45.5189, longitude: -122.6812,
      address: "1450 SW Broadway, Portland, OR",
      reporterId: maria._id,
      reporterName: "Maria Santos",
      departmentId: waterDept._id,
      assignedOfficerId: waterDept.officers[0]._id.toString(),
      assignedOfficerName: "Officer Elena Rostova",
      media: [{ url: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=600&auto=format&fit=crop", type: "image" }],
      verifications: [
        { userId: alex._id, userName: "Alex Reed", isConfirmed: true, timestamp: new Date("2026-06-21T07:45:00Z") }
      ],
      comments: [],
      trustScore: 89,
      slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
      autoEscalated: true,
      createdAt: new Date("2026-06-21T07:15:00Z"),
      updatedAt: new Date("2026-06-21T08:30:00Z")
    },
    {
      title: "Uncontrolled Garbage Accumulation near Park Gate",
      description: "A huge pile of household plastic and garbage bags dumped on the green field, blocking pedestrian trails.",
      category: "Garbage Accumulation",
      severity: "Medium",
      status: "Reported",
      latitude: 45.5312, longitude: -122.6589,
      address: "2201 NE Clackamas St, Portland, OR",
      reporterId: david._id,
      reporterName: "David Chen",
      departmentId: wasteDept._id,
      media: [{ url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600&auto=format&fit=crop", type: "image" }],
      verifications: [],
      comments: [],
      trustScore: 82,
      slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
      createdAt: new Date("2026-06-22T08:00:00Z"),
      updatedAt: new Date("2026-06-22T08:00:00Z")
    },
    {
      title: "Broken Streetlight on Commercial Ave",
      description: "The entire stretch of street from the crossroad is pitched in complete darkness, raising security concerns.",
      category: "Broken Streetlight",
      severity: "Medium",
      status: "Resolved",
      latitude: 45.5098, longitude: -122.6455,
      address: "4110 SE Commercial Ave, Portland, OR",
      reporterId: alex._id,
      reporterName: "Alex Reed",
      departmentId: lightDept._id,
      media: [{ url: "https://images.unsplash.com/photo-1542382257-201b72a2143a?q=80&w=600&auto=format&fit=crop", type: "image" }],
      verifications: [
        { userId: david._id, userName: "David Chen", isConfirmed: true, timestamp: new Date("2026-06-19T22:30:00Z") }
      ],
      comments: [],
      trustScore: 96,
      resolutionEvidence: {
        imageUrl: "https://images.unsplash.com/photo-1506546332852-6d588372d6b0?q=80&w=600&auto=format&fit=crop",
        notes: "Replaced burnt LED lamp driver and verified optical emission line status with grid patrol.",
        resolvedAt: new Date("2026-06-21T18:00:00Z")
      },
      slaDeadline: new Date("2026-06-25T08:00:00Z"),
      createdAt: new Date("2026-06-19T21:00:00Z"),
      updatedAt: new Date("2026-06-21T18:00:00Z")
    }
  ]);
  console.log(`[Seed] Inserted ${issues.length} issues`);

  await Notification.insertMany([
    { userId: alex._id, title: "Issue Verified", message: "Your reported pothole on Pine Street was verified by 2 community members.", type: "success", isRead: false, issueId: issues[0]._id },
    { userId: alex._id, title: "Badge Unlocked!", message: "Congratulations! You have unlocked your 'Neighborhood Guardian' badge.", type: "badge", isRead: false },
    { userId: maria._id, title: "Can you verify?", message: "A garbage pile has been reported near NE Clackamas St. Are you nearby to verify?", type: "info", isRead: false, issueId: issues[2]._id }
  ]);
  console.log("[Seed] Inserted notifications");

  await Prediction.insertMany([
    { title: "High-Risk Garbage Hotspot", category: "Garbage Accumulation", latitude: 45.5290, longitude: -122.6510, riskFactor: 0.88, reason: "Consistent overflow and weekend trash aggregation based on past 3 months event logs." },
    { title: "Drainage Risk Under heavy rain", category: "Drainage Issue", latitude: 45.5120, longitude: -122.6780, riskFactor: 0.72, reason: "Silt accretion and broken culverts detected in surrounding street drainage channels." },
    { title: "Pothole Growth Threat Segment", category: "Pothole", latitude: 45.5240, longitude: -122.6930, riskFactor: 0.61, reason: "Elevated vibration signatures and micro-cracks detected by public bus accelerometer telemetry." }
  ]);
  console.log("[Seed] Inserted predictions");

  await AuditLog.insertMany([
    { userId: alex._id, userName: "Alex Reed", userRole: "Citizen", action: "REPORT_ISSUE", details: "Reported deep pothole on SW Pine St" },
    { userId: marcus._id, userName: "Officer Marcus Vance", userRole: "Officer", action: "ASSIGN_TICKET", details: "Assigned ticket to Marcus Vance" }
  ]);
  console.log("[Seed] Inserted audit logs");

  console.log("\n[Seed] ✅ Database seeded successfully!");
  console.log(`  Users: ${users.length}`);
  console.log(`  Departments: ${departments.length}`);
  console.log(`  Issues: ${issues.length}`);
  console.log(`  User IDs for reference:`);
  users.forEach(u => console.log(`    ${u.name}: ${u._id}`));

  return { users, departments, issues };
}

export async function seedDatabase({ reset = false } = {}) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
      console.log("[Seed] Connected to MongoDB");
    }

    if (!reset) {
      const [userCount, issueCount, departmentCount] = await Promise.all([
        User.countDocuments(),
        Issue.countDocuments(),
        Department.countDocuments()
      ]);

      if (userCount > 0 || issueCount > 0 || departmentCount > 0) {
        console.log("[Seed] Existing data detected; skipping bootstrap.");
        return false;
      }
    }

    await insertSeedData();
    return true;
  } catch (error) {
    console.error("[Seed] ❌ Seeding failed:", error);
    throw error;
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  seedDatabase({ reset: true })
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async () => {
      await mongoose.disconnect().catch(() => { });
      process.exit(1);
    });
}
