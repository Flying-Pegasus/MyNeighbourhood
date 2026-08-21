import Issue from "../models/Issue.js";
import Department from "../models/Department.js";
import Prediction from "../models/Prediction.js";
import { ai, isGeminiEnabled } from "../services/gemini.js";

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
The output MUST be raw JSON adhering exactly to this structure:
{
  "title": "A short, visual, human-like title of the issue",
  "category": "One of: Pothole, Water Leakage, Broken Streetlight, Garbage Accumulation, Drainage Issue, Damaged Road, Public Infrastructure, Illegal Dumping, Fallen Tree, Traffic Signal Issue",
  "severity": "Low, Medium, High, or Critical",
  "summary": "Actionable, clear detailed summary description for the city workforce.",
  "departmentRecommended": "One of: Road Maintenance Dept, Water and Sanitation Dept, Public Lighting Division, Parks & Waste Management, Traffic and Safety Control"
}

Severity guidance:
- Critical: Immediate extreme danger, major flooding, raw sewage, severe traffic blocks.
- High: Deep pothole, completely dark block, blocked lane, broken traffic signals on major junction.
- Medium: Normal garbage accumulation, single broken streetlight, sidewalk minor cracking.
- Low: Cosmetic park infrastructure paint issues, loose railings.
`;

      let contents = [];
      if (base64Image) {
        contents.push({
          inlineData: { mimeType: "image/jpeg", data: base64Image }
        });
      }
      contents.push({
        text: `Analyze this citizenship concern:\nAddress: ${address || "Unknown"}\nUser notes: ${description || "None, inspect photo as main evidence."}`
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      aiResponseText = response.text || "";
    } else {
      // Rule-based fallback
      console.log("No Gemini API key configured. Using rule-based triage simulator.");
      const departments = await Department.find();
      
      const textForFuzzy = (description || "").toLowerCase();
      let category = "Public Infrastructure";
      let severity = "Medium";
      let deptCode = "WASTE";

      if (textForFuzzy.includes("pothole") || textForFuzzy.includes("hole") || textForFuzzy.includes("cracked road")) {
        category = "Pothole";
        severity = textForFuzzy.includes("big") || textForFuzzy.includes("deep") || textForFuzzy.includes("tire") ? "High" : "Medium";
        deptCode = "ROAD";
      } else if (textForFuzzy.includes("water") || textForFuzzy.includes("leak") || textForFuzzy.includes("burst")) {
        category = "Water Leakage";
        severity = textForFuzzy.includes("flood") || textForFuzzy.includes("burst") ? "Critical" : "High";
        deptCode = "WATER";
      } else if (textForFuzzy.includes("light") || textForFuzzy.includes("dark") || textForFuzzy.includes("lamp")) {
        category = "Broken Streetlight";
        severity = "Medium";
        deptCode = "LIGHT";
      } else if (textForFuzzy.includes("garbage") || textForFuzzy.includes("trash") || textForFuzzy.includes("dump") || textForFuzzy.includes("rubbish")) {
        category = "Garbage Accumulation";
        severity = textForFuzzy.includes("illegal") ? "High" : "Medium";
        deptCode = "WASTE";
      } else if (textForFuzzy.includes("drain") || textForFuzzy.includes("clog") || textForFuzzy.includes("flooding")) {
        category = "Drainage Issue";
        severity = "High";
        deptCode = "WATER";
      } else if (textForFuzzy.includes("tree") || textForFuzzy.includes("fall") || textForFuzzy.includes("branch")) {
        category = "Fallen Tree";
        severity = "High";
        deptCode = "WASTE";
      } else if (textForFuzzy.includes("traffic") || textForFuzzy.includes("signal")) {
        category = "Traffic Signal Issue";
        severity = "Critical";
        deptCode = "TRAFFIC";
      }

      const dept = departments.find(d => d.code === deptCode);
      const cleanTitle = `Reported ${category} at ${address?.split(",")[0] || "Local Street"}`;
      const mockResult = {
        title: cleanTitle,
        category,
        severity,
        summary: description || `Simulated triage of reported ${category.toLowerCase()} causing civic discomfort.`,
        departmentRecommended: dept?.name || "Road Maintenance Dept"
      };

      aiResponseText = JSON.stringify(mockResult);
    }

    res.json(JSON.parse(aiResponseText));
  } catch (error) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze issue via AI." });
  }
}

// AI Civic Chatbot: Handles rich contextual Q&A
export async function chat(req, res) {
  const { messages, userId } = req.body;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "Missing conversation messages." });
  }

  try {
    const User = (await import("../models/User.js")).default;
    const user = userId ? await User.findById(userId) : null;
    const issues = await Issue.find().sort({ createdAt: -1 }).limit(20);
    const predictions = await Prediction.find();

    const issuesListStr = issues.map(iss => {
      return `Ticket ID: "${iss._id}", Title: "${iss.title}", Category: "${iss.category}", Severity: "${iss.severity}", Status: "${iss.status}", Address: "${iss.address}", Officer: "${iss.assignedOfficerName || "None"}", Trust: "${iss.trustScore}%", SLA Breach: ${iss.slaBreach ? "YES" : "No"}, Created: "${iss.createdAt}".`;
    }).join("\n");

    const predictionsStr = predictions.map(pred => {
      return `Prediction: "${pred.title}", Category: "${pred.category}", Risk: "${Math.round(pred.riskFactor * 100)}%", Reason: "${pred.reason}".`;
    }).join("\n");

    const systemInstruction = `
You are the MyNeighbourhood AI Community Assistant, enhancing citizen-municipal trust.
Tone: objective, encouraging, informative.

Live data:
=== ACTIVE ISSUES ===
${issuesListStr}

=== PREDICTIVE HOTSPOTS ===
${predictionsStr}

=== DEPARTMENTS ===
- Road Maintenance Dept: Potholes, road wear, broken sidewalks.
- Water and Sanitation Dept: Water leaks, bursts, clogged drains.
- Public Lighting Division: Broken lamp posts, grid faults.
- Parks & Waste Management: Garbage, dumping, fallen trees.
- Traffic and Safety Control: Traffic signals, road closures.

Current user: ${user?.name || "Guest"} (XP: ${user?.points || 0}, Badges: ${user?.badges?.join(", ") || "None"}).

Rules:
- Reference specific tickets by ID when asked about status.
- Don't invent tickets not in the data.
- Keep answers in clean markdown with bold key terms.
- Mention SLA breaches if relevant.
`;

    if (isGeminiEnabled && ai) {
      const contents = messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { systemInstruction, temperature: 0.7 }
      });

      res.json({ content: response.text || "Unable to generate response." });
    } else {
      // Fallback
      const lastMsg = messages[messages.length - 1].content.toLowerCase();
      let replyText = "";

      if (lastMsg.includes("status") || lastMsg.includes("complaint") || lastMsg.includes("ticket")) {
        const activeIssues = issues.filter(i => !["Closed", "Resolved"].includes(i.status));
        replyText = `Currently tracking **${activeIssues.length} active issues**:\n\n`;
        activeIssues.slice(0, 5).forEach((iss, i) => {
          replyText += `${i + 1}. **${iss.title}**: Status **${iss.status}**${iss.assignedOfficerName ? ` — assigned to ${iss.assignedOfficerName}` : ""}${iss.slaBreach ? " ⚠️ **SLA BREACH**" : ""}\n`;
        });
      } else if (lastMsg.includes("sla") || lastMsg.includes("breach") || lastMsg.includes("deadline")) {
        const breached = issues.filter(i => i.slaBreach);
        replyText = breached.length > 0
          ? `⚠️ **${breached.length} issue(s) have breached SLA deadlines:**\n\n${breached.map(i => `- **${i.title}** (${i.severity}) — deadline was ${new Date(i.slaDeadline).toLocaleString()}`).join("\n")}`
          : "✅ All current issues are within their SLA deadlines.";
      } else if (lastMsg.includes("department") || lastMsg.includes("who handles")) {
        replyText = `Our municipality routes tickets to **5 departments**:\n- **Road Maintenance**: Potholes, asphalt.\n- **Water & Sanitation**: Pipes, leaks, drainage.\n- **Public Lighting**: Streetlights, grid wiring.\n- **Parks & Waste**: Garbage, dumping, trees.\n- **Traffic Safety**: Signals, closures.\n\nAI triage auto-recommends the right department!`;
      } else {
        replyText = `Hello! I'm the **MyNeighbourhood AI Assistant**.\n\nAsk me:\n- *"What's the status of my complaints?"*\n- *"Any SLA breaches?"*\n- *"Show unresolved issues near me"*\n- *"Who handles drainage problems?"*\n\nHow can I help today?`;
      }

      res.json({ content: replyText });
    }
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Chat unavailable." });
  }
}

// Predictive Hotspots
export async function getHotspots(req, res) {
  try {
    const predictions = await Prediction.find();
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
