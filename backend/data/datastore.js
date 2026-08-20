import { 
  IssueCategory, 
  IssueSeverity, 
  IssueStatus, 
  UserRole
} from "../../src/types.js";

// Persistent In-Memory Database
export const datastore = {
  users: [
    { id: "u-1", name: "Alex Reed", email: "alex@civicpulse.ai", role: UserRole.CITIZEN, points: 145, badges: ["Local Reporter", "Neighborhood Guardian"], credibilityScore: 92 },
    { id: "u-2", name: "Maria Santos", email: "maria@civicpulse.ai", role: UserRole.CITIZEN, points: 55, badges: ["Local Reporter"], credibilityScore: 85 },
    { id: "u-3", name: "David Chen", email: "david@civicpulse.ai", role: UserRole.CITIZEN, points: 210, badges: ["Local Reporter", "Neighborhood Guardian", "Community Hero"], credibilityScore: 98 },
    { id: "u-4", name: "Officer Marcus Vance", email: "marcus.vance@metro.gov", role: UserRole.OFFICER, points: 0, badges: [], credibilityScore: 100 },
    { id: "u-5", name: "Director Sarah Jenkins", email: "sarah.jenkins@metro.gov", role: UserRole.ADMIN, points: 0, badges: [], credibilityScore: 100 }
  ],

  departments: [
    { id: "dept-1", name: "Road Maintenance Dept", code: "ROAD", officerCount: 3 },
    { id: "dept-2", name: "Water and Sanitation Dept", code: "WATER", officerCount: 4 },
    { id: "dept-3", name: "Public Lighting Division", code: "LIGHT", officerCount: 2 },
    { id: "dept-4", name: "Parks & Waste Management", code: "WASTE", officerCount: 5 },
    { id: "dept-5", name: "Traffic and Safety Control", code: "TRAFFIC", officerCount: 3 }
  ],

  officers: [
    { id: "off-1", name: "Officer Marcus Vance", email: "marcus.vance@metro.gov", departmentId: "dept-1", isAvailable: true },
    { id: "off-2", name: "Officer Elena Rostova", email: "elena.r@metro.gov", departmentId: "dept-2", isAvailable: true },
    { id: "off-3", name: "Inspector Kenji Sato", email: "kenji.s@metro.gov", departmentId: "dept-4", isAvailable: false }
  ],

  issues: [
    {
      id: "ticket-101",
      title: "Extremely Deep Pothole on Pine Street Blvd",
      description: "A hazardous pothole has opened up in the middle of the street right opposite Metro Library. It's causing cars to swerve or suffer tyre damage. Needs urgent patching.",
      category: IssueCategory.POTHOLE,
      severity: IssueSeverity.HIGH,
      status: IssueStatus.ASSIGNED,
      latitude: 45.5231,
      longitude: -122.6765,
      address: "1012 SW Pine St, Portland, OR",
      reporterId: "u-1",
      reporterName: "Alex Reed",
      departmentId: "dept-1",
      assignedOfficerId: "off-1",
      assignedOfficerName: "Officer Marcus Vance",
      media: [
        { id: "m-1", url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop", type: "image", uploadedAt: "2026-06-20T09:30:00Z" }
      ],
      verifications: [
        { id: "v-1", userId: "u-2", userName: "Maria Santos", isConfirmed: true, timestamp: "2026-06-20T11:00:00Z" },
        { id: "v-2", userId: "u-3", userName: "David Chen", isConfirmed: true, timestamp: "2026-06-20T12:15:00Z" }
      ],
      comments: [
        { id: "c-1", userId: "u-4", userName: "Officer Marcus Vance", userRole: UserRole.OFFICER, content: "Slight asphalt mixing delayed, scheduled repairs for tomorrow morning during low traffic.", timestamp: "2026-06-21T14:00:00Z" }
      ],
      trustScore: 94,
      createdAt: "2026-06-20T09:30:00Z",
      updatedAt: "2026-06-21T14:00:00Z"
    },
    {
      id: "ticket-102",
      title: "Major Main Water Pipeline Failure",
      description: "Huge streams of clean water erupting from the sidewalk, flooding the adjacent bicycle lanes and parking bays.",
      category: IssueCategory.WATER_LEAK,
      severity: IssueSeverity.CRITICAL,
      status: IssueStatus.IN_PROGRESS,
      latitude: 45.5189,
      longitude: -122.6812,
      address: "1450 SW Broadway, Portland, OR",
      reporterId: "u-2",
      reporterName: "Maria Santos",
      departmentId: "dept-2",
      assignedOfficerId: "off-2",
      assignedOfficerName: "Officer Elena Rostova",
      media: [
        { id: "m-2", url: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=600&auto=format&fit=crop", type: "image", uploadedAt: "2026-06-21T07:15:00Z" }
      ],
      verifications: [
        { id: "v-3", userId: "u-1", userName: "Alex Reed", isConfirmed: true, timestamp: "2026-06-21T07:45:00Z" }
      ],
      comments: [],
      trustScore: 89,
      createdAt: "2026-06-21T07:15:00Z",
      updatedAt: "2026-06-21T08:30:00Z"
    },
    {
      id: "ticket-103",
      title: "Uncontrolled Garbage Accumulation near Park Gate",
      description: "A huge pile of household plastic and garbage bags dumped on the green field, blocking pedestrian trails.",
      category: IssueCategory.GARBAGE_ACCUMULATION,
      severity: IssueSeverity.MEDIUM,
      status: IssueStatus.REPORTED,
      latitude: 45.5312,
      longitude: -122.6589,
      address: "2201 NE Clackamas St, Portland, OR",
      reporterId: "u-3",
      reporterName: "David Chen",
      departmentId: "dept-4",
      media: [
        { id: "m-3", url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600&auto=format&fit=crop", type: "image", uploadedAt: "2026-06-22T08:00:00Z" }
      ],
      verifications: [],
      comments: [],
      trustScore: 82,
      createdAt: "2026-06-22T08:00:00Z",
      updatedAt: "2026-06-22T08:00:00Z"
    },
    {
      id: "ticket-104",
      title: "Broken Streetlight on Commercial Ave",
      description: "The entire stretch of street from the crossroad is pitched in complete darkness, raising security concerns.",
      category: IssueCategory.BROKEN_STREETLIGHT,
      severity: IssueSeverity.MEDIUM,
      status: IssueStatus.RESOLVED,
      latitude: 45.5098,
      longitude: -122.6455,
      address: "4110 SE Commercial Ave, Portland, OR",
      reporterId: "u-1",
      reporterName: "Alex Reed",
      departmentId: "dept-3",
      media: [
        { id: "m-4", url: "https://images.unsplash.com/photo-1542382257-201b72a2143a?q=80&w=600&auto=format&fit=crop", type: "image", uploadedAt: "2026-06-19T21:00:00Z" }
      ],
      verifications: [
        { id: "v-4", userId: "u-3", userName: "David Chen", isConfirmed: true, timestamp: "2026-06-19T22:30:00Z" }
      ],
      comments: [],
      trustScore: 96,
      createdAt: "2026-06-19T21:00:00Z",
      updatedAt: "2026-06-21T18:00:00Z",
      resolutionEvidence: {
        imageUrl: "https://images.unsplash.com/photo-1506546332852-6d588372d6b0?q=80&w=600&auto=format&fit=crop",
        notes: "Replaced burnt LED lamp driver and verified optical emission line status with grid patrol.",
        resolvedAt: "2026-06-21T18:00:00Z"
      }
    }
  ],

  notifications: [
    { id: "nt-1", userId: "u-1", title: "Issue Verified", message: "Your reported pothole on Pine Street was verified by 2 community members.", type: "success", timestamp: "2026-06-20T12:15:00Z", isRead: false, issueId: "ticket-101" },
    { id: "nt-2", userId: "u-1", title: "Badge Unlocked!", message: "Congratulations! You have unlocked your 'Neighborhood Guardian' badge.", type: "badge", timestamp: "2026-06-21T11:00:00Z", isRead: false },
    { id: "nt-3", userId: "u-2", title: "Can you verify?", message: "A garbage pile has been reported near NE Clackamas St. Are you nearby to verify?", type: "info", timestamp: "2026-06-22T08:12:00Z", isRead: false, issueId: "ticket-103" }
  ],

  predictions: [
    { id: "pred-1", title: "High-Risk Garbage Hotspot", category: IssueCategory.GARBAGE_ACCUMULATION, latitude: 45.5290, longitude: -122.6510, riskFactor: 0.88, reason: "Consistent overflow and weekend trash aggregation based on past 3 months event logs." },
    { id: "pred-2", title: "Drainage Risk Under heavy rain", category: IssueCategory.DRAINAGE_ISSUE, latitude: 45.5120, longitude: -122.6780, riskFactor: 0.72, reason: "Silt accretion and broken culverts detected in surrounding street drainage channels." },
    { id: "pred-3", title: "Pothole Growth Threat Segment", category: IssueCategory.POTHOLE, latitude: 45.5240, longitude: -122.6930, riskFactor: 0.61, reason: "Elevated vibration signatures and micro-cracks detected by public bus accelerometer telemetry." }
  ],

  auditLogs: [
    { id: "log-1", userId: "u-1", userName: "Alex Reed", userRole: "Citizen", action: "REPORT_ISSUE", details: "Reported deep pothole on SW Pine St", timestamp: "2026-06-20T09:30:00Z" },
    { id: "log-2", userId: "u-4", userName: "Officer Marcus Vance", userRole: "Officer", action: "ASSIGN_TICKET", details: "Assigned ticket-101 to Marcus Vance", timestamp: "2026-06-21T12:00:00Z" }
  ]
};

// Trust Score Calculator
export function recalculateTrustScore(issue) {
  const confirms = issue.verifications.filter(v => v.isConfirmed).length;
  const rejections = issue.verifications.filter(v => !v.isConfirmed).length;
  let score = 75; // Base confidence score

  score += confirms * 12;
  score -= rejections * 25;

  // Bound between 10 and 99
  issue.trustScore = Math.max(10, Math.min(99, score));
}

// Helper: Evaluates badges earned by point milestones
export function evaluateUserBadges(user) {
  const currentBadges = [...user.badges];
  
  if (user.points >= 30 && !currentBadges.includes("Local Reporter")) {
    currentBadges.push("Local Reporter");
    datastore.notifications.unshift({
      id: `not-${Date.now()}-b1`,
      userId: user.id,
      title: "Badge Unlocked: Local Reporter!",
      message: "You've earned the 'Local Reporter' badge for your active alert inputs.",
      type: "badge",
      timestamp: new Date().toISOString(),
      isRead: false
    });
  }
  
  if (user.points >= 80 && !currentBadges.includes("Neighborhood Guardian")) {
    currentBadges.push("Neighborhood Guardian");
    datastore.notifications.unshift({
      id: `not-${Date.now()}-b2`,
      userId: user.id,
      title: "Badge Unlocked: Neighborhood Guardian!",
      message: "You've earned the 'Neighborhood Guardian' badge for confirming civic facts.",
      type: "badge",
      timestamp: new Date().toISOString(),
      isRead: false
    });
  }

  if (user.points >= 150 && !currentBadges.includes("Community Hero")) {
    currentBadges.push("Community Hero");
    datastore.notifications.unshift({
      id: `not-${Date.now()}-b3`,
      userId: user.id,
      title: "Badge Unlocked: Community Hero!",
      message: "Incredible commitment! You are now recognized as an official Community Hero.",
      type: "badge",
      timestamp: new Date().toISOString(),
      isRead: false
    });
  }

  user.badges = currentBadges;
}
