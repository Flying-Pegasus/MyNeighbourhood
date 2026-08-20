import { datastore } from "../data/datastore.js";
import { ai, isGeminiEnabled } from "../services/gemini.js";
import { IssueCategory, IssueSeverity } from "../../src/types.js";

// AI Reporting Route: Analyze image/description with Gemini
export async function analyzeIssue(req, res) {
  const { base64Image, description, address, latitude, longitude } = req.body;
  
  if (!description && !base64Image) {
    return res.status(400).json({ error: "Provide either a description or an image for analysis." });
  }

  try {
    let aiResponseText = "";

    if (isGeminiEnabled && ai) {
      const systemInstruction = `
You are the MyNeighbourhood AI triage engine. Look at the description and optional image attached of a city repair/infrastructure issue.
Your task is to classify this issue and present metadata in structured JSON format.
The output MUST be raw JSON adhering exactly to this structure (do not wrap in markdown block except if requested, output valid searchable string):
{
  "title": "A short, visual, human-like title of the issue",
  "category": "One of: Pothole, Water Leakage, Broken Streetlight, Garbage Accumulation, Drainage Issue, Damaged Road, Public Infrastructure, Illegal Dumping, Fallen Tree, Traffic Signal Issue",
  "severity": "Low, Medium, High, or Critical",
  "summary": "Actionable, clear detailed summary description for the city workforce.",
  "departmentRecommended": "One of: Road Maintenance Dept, Water and Sanitation Dept, Public Lighting Division, Parks & Waste Management, Traffic and Safety Control"
}

Guidance for severity selection:
- Critical: Causes immediate extreme danger, major flooding, raw sewage, or severe traffic blocks.
- High: Deep pothole, completely dark block, blocked lane, broken traffic signals on major junction.
- Medium: Normal garbage accumulation, single broken streetlight, sidewalk minor cracking.
- Low: Cosmetic park infrastructure paint issues, loose railings.
`;

      let contents = [];
      if (base64Image) {
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        });
      }
      contents.push({
        text: `Analyze this citizenship concern reported by user:\nAddress or Location: ${address || "Unknown"}\nUser notes: ${description || "None, please inspect photo closely as main evidence."}`
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      aiResponseText = response.text || "";
    } else {
      // Rule-based elegant fallback for preview sandbox when API key is unconfigured
      console.log("No Gemini API key configured. Using intelligent rule-based triage simulator.");
      
      const textForFuzzy = (description || "").toLowerCase();
      let category = IssueCategory.INFRASTRUCTURE_FAILURE;
      let severity = IssueSeverity.MEDIUM;
      let dept = "dept-4"; // Parks & Waste

      if (textForFuzzy.includes("pothole") || textForFuzzy.includes("hole") || textForFuzzy.includes("cracked road")) {
        category = IssueCategory.POTHOLE;
        severity = textForFuzzy.includes("big") || textForFuzzy.includes("deep") || textForFuzzy.includes("tire") ? IssueSeverity.HIGH : IssueSeverity.MEDIUM;
        dept = "dept-1"; // Road Maintenance
      } else if (textForFuzzy.includes("water") || textForFuzzy.includes("leak") || textForFuzzy.includes("burst")) {
        category = IssueCategory.WATER_LEAK;
        severity = textForFuzzy.includes("flood") || textForFuzzy.includes("burst") ? IssueSeverity.CRITICAL : IssueSeverity.HIGH;
        dept = "dept-2"; // Water & Sanitation
      } else if (textForFuzzy.includes("light") || textForFuzzy.includes("dark") || textForFuzzy.includes("lamp")) {
        category = IssueCategory.BROKEN_STREETLIGHT;
        severity = IssueSeverity.MEDIUM;
        dept = "dept-3"; // Public Lighting
      } else if (textForFuzzy.includes("garbage") || textForFuzzy.includes("trash") || textForFuzzy.includes("dump") || textForFuzzy.includes("rubbish")) {
        category = IssueCategory.GARBAGE_ACCUMULATION;
        severity = textForFuzzy.includes("illegal") ? IssueSeverity.HIGH : IssueSeverity.MEDIUM;
        dept = "dept-4"; // Parks & Waste
      } else if (textForFuzzy.includes("drain") || textForFuzzy.includes("clog") || textForFuzzy.includes("flooding")) {
        category = IssueCategory.DRAINAGE_ISSUE;
        severity = IssueSeverity.HIGH;
        dept = "dept-2"; // Water & Sanitation
      } else if (textForFuzzy.includes("tree") || textForFuzzy.includes("fall") || textForFuzzy.includes("branch")) {
        category = IssueCategory.FALLEN_TREE;
        severity = IssueSeverity.HIGH;
        dept = "dept-4"; // Parks & Waste
      } else if (textForFuzzy.includes("light") && (textForFuzzy.includes("traffic") || textForFuzzy.includes("signal"))) {
        category = IssueCategory.TRAFFIC_SIGNAL;
        severity = IssueSeverity.CRITICAL;
        dept = "dept-5"; // Traffic Control
      }

      const cleanTitle = `Reported ${category} at ${address?.split(",")[0] || "Local Street"}`;
      const mockResult = {
        title: cleanTitle,
        category,
        severity,
        summary: description || `Simulated triage of reported ${category.toLowerCase()} causing civic discomfort. Verification required in due course.`,
        departmentRecommended: datastore.departments.find(d => d.id === dept)?.name || "Road Maintenance Dept"
      };

      aiResponseText = JSON.stringify(mockResult);
    }

    res.json(JSON.parse(aiResponseText));
  } catch (error) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze reported issue via AI." });
  }
}

// AI Civic Chatbot Route: Handles rich system-wide contextual Q&A
export async function chat(req, res) {
  const { messages, userId } = req.body;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "Missing conversation message logs." });
  }

  try {
    const user = datastore.users.find(u => u.id === (userId || "u-1"));
    const issuesListStr = datastore.issues.map(iss => {
      const verificationsCount = iss.verifications.length;
      return `Ticket ID: "${iss.id}", Title: "${iss.title}", Category: "${iss.category}", Severity: "${iss.severity}", Status: "${iss.status}", Address: "${iss.address}", Assigned Officer: "${iss.assignedOfficerName || "None"}", Trust Score: "${iss.trustScore}%", VerificationsCount: ${verificationsCount}, Created at: "${iss.createdAt}".`;
    }).join("\n");

    const predictionsStr = datastore.predictions.map(pred => {
      return `Prediction Area: "${pred.title}", Category: "${pred.category}", Risk Factor: "${Math.round(pred.riskFactor * 100)}%", Reason: "${pred.reason}".`;
    }).join("\n");

    const systemInstruction = `
You are the MyNeighbourhood AI Community Assistant, a highly intelligent and friendly chatbot dedicated to enhancing citizen-municipal trust and transparency.
Your tone should be objective, encouraging, and informative, avoiding technical jargon where possible, yet highly accountable.

Below is the live operational data from the City Portal:
=== UNRESOLVED & ACTIVE ISSUES ===
${issuesListStr}

=== AI PREDICTIVE HOTSPOTS ===
${predictionsStr}

=== MUNICIPAL DEPARTMENTS ===
- Road Maintenance Dept: Handles pot holes, road wear, broken sidewalks.
- Water and Sanitation Dept: Handles clean water leakages, main line bursts, clogged storm drains, raw sewer overflows.
- Public Lighting Division: Handles blacked-out lamp posts, solar bulb failures, grid wiring faults.
- Parks & Waste Management: Handles rubbish overflow, leaf debris, illegal dumping sites, and fallen trees.
- Traffic and Safety Control: Handles traffic delays, failing crossing signals, and road closures.

Current Active Citizen User logged in: ${user?.name || "Guest Citizen"} (XP Points: ${user?.points || 0}, Badges: ${user?.badges?.join(", ") || "None"}).

Helpful constraints:
- Speak directly about specific tickets by name if they ask for their status.
- If they ask "What's the status of my complaint?", query the issues lists for Alex Reed or Maria Santos depending on user, or show open items likeSW Broadway Water Leakage (ticket-102) or Pine Street Blvd Pothole (ticket-101).
- If they ask "Why is this delayed?", highlight that municipal logistics such as asphalt mixers (e.g. on Pine St) or pipe supplies might be currently assigned and scheduled, or explain based on the status (In Progress, Assigned).
- Do NOT make up tickets that are not listed above, but feel free to suggest they can submit a new ticket directly via the reporting dashboard at any time.
- Keep answers formatted in highly clean markdown with clear spacing. Bold key terms.
`;

    if (isGeminiEnabled && ai) {
      // Map user/agent message array to Gemini contents SDK structure
      const contents = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      const reply = response.text || "I was unable to extract a text response from MyNeighbourhood AI services. Please try again shortly.";
      res.json({ content: reply });
    } else {
      // Rule-based conversational simulator fallback
      const lastUserMsg = messages[messages.length - 1].content.toLowerCase();
      let replyText = "";

      if (lastUserMsg.includes("status") || lastUserMsg.includes("complaint") || lastUserMsg.includes("my ticket")) {
        replyText = `Hello! Currently, there are **3 active issues** in your neighborhood:
1. **SW Pine Street Pothole (ticket-101)**: Status is **Assigned** to Officer Marcus Vance. Repairs are scheduled for tomorrow morning during low-intensity traffic cycles.
2. **SW Broadway Water Leakage (ticket-102)**: Status is **In Progress**. Officer Elena Rostova is actively sealing the main conduit right now.
3. **NE Clackamas St Garbage Overflow (ticket-103)**: Status is **Reported**. It is awaiting further community confirmation to boost its trust score!

Which one of these would you like to track in detail?`;
      } else if (lastUserMsg.includes("delay") || lastUserMsg.includes("why is it take")) {
        replyText = `Under stood. Some issues like the **SW Pine Street Pothole** have experienced minor delays because the Road Maintenance Team had to synchronize asphalt mixing with low-vibration transit slots. Scheduling is set for tomorrow morning to minimize disruption. We appreciate your community-focused patience!`;
      } else if (lastUserMsg.includes("department") || lastUserMsg.includes("who handles")) {
        replyText = `Our municipality routes tickets to **5 specialized subdivisions**:
- **Road Maintenance**: Potholes and asphalt surface layers.
- **Water & Sanitation**: Water pipes, leaks, and drainage.
- **Public Lighting**: Dark corridors and broken lamp bulbs.
- **Parks & Waste**: Garbage collection, dumping, and fallen branches.
- **Traffic Safety**: Signals, indicators, and safety boards.

Our AI triage automatically recommends the optimal department when you upload your photo!`;
      } else if (lastUserMsg.includes("near me") || lastUserMsg.includes("unresolved")) {
        replyText = `I found **3 unresolved issues** near your current coordinates:
- 🚨 **Water Leakage** | SW Broadway (Critical, 140m away) - In Progress
- ⚠️ **Pothole** | SW Pine St (High, 320m away) - Assigned
- 🗑️ **Garbage Accumulation** | NE Clackamas St (Medium, 1.2km away) - Reported

You can access the interactive **Civic Map** to verify these or add photo proof to increase their Trust Scores!`;
      } else {
        replyText = `Hello! I am your **MyNeighbourhood AI Assistant**. I bridge communications between you and municipal managers.

You can ask me questions like:
- *"What is status of SW Pine Street pothole?"*
- *"Show unresolved issues near me"*
- *"Why are repairs on Pine St delayed?"*
- *"Who handles sewer leakage in the park?"*
- *"How can I earn badges?"*

How can I boost your community efforts today?`;
      }

      res.json({ content: replyText });
    }
  } catch (error) {
    console.error("Chat assist error:", error);
    res.status(500).json({ error: error.message || "Conversational bridge unavailable." });
  }
}

// Predictive Hotspots list
export function getHotspots(req, res) {
  res.json(datastore.predictions);
}
