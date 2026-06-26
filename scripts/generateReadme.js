const fs = require("fs");
const path = require("path");
require("dotenv").config();

const ROOT_DIR = path.join(__dirname, "..");
const TEMPLATE_PATH = path.join(ROOT_DIR, "README.template.md");
const README_PATH = path.join(ROOT_DIR, "README.md");

const PROFILE = {
  name: "Himanshu Vishwakarma",
  role: "Full Stack Developer (MERN + Cloud)",
  company: "Inkhub Tattoos",
  email: "himanshu1972002@gmail.com",
  techStack: [
    "React.js",
    "Next.js",
    "Node.js",
    "Express.js",
    "MongoDB",
    "Redis",
    "AWS",
    "Docker",
    "WebSockets",
  ],
  highlights: [
    "Built real-time dashboards and systems for 80K+ users",
    "Real-time WebSocket order-streaming system",
    "B.Tech in Computer Science & Engineering",
    "Movie recommendation system using Scikit-learn",
  ],
  askMeAbout: [
    "Next.js",
    "WebSockets",
    "MERN Stack",
    "APIs",
    "System Design",
  ],
};

const FALLBACKS = {
  AI_BIO: `Hi, I'm **Himanshu Vishwakarma**, a full-stack (MERN) and cloud-focused developer with hands-on experience building scalable, high-performance applications. I currently work as a Software Development Engineer at **Inkhub Tattoos**, specializing in React.js, Next.js, Node.js, Express.js, Redis, AWS, Docker, and WebSockets.

I'm passionate about modern web technologies, real-time systems, and cloud-native development — turning complex problems into simple, elegant solutions for **80K+ users**.`,

  AI_QUOTE:
    "The best way to predict the future is to build it — one commit at a time.",

  AI_TECH_TIP: `> **Tip:** When scaling WebSocket connections, use Redis Pub/Sub as a message broker so multiple server instances can broadcast events reliably across your cluster.`,
};

const PLACEHOLDERS = ["AI_BIO", "AI_QUOTE", "AI_TECH_TIP"];

function formatDate() {
  return new Date().toISOString().split("T")[0];
}

function buildPrompt() {
  return `You are writing content for a GitHub profile README. Generate three sections in JSON format only — no markdown code fences.

Profile:
- Name: ${PROFILE.name}
- Role: ${PROFILE.role}
- Company: ${PROFILE.company}
- Tech: ${PROFILE.techStack.join(", ")}
- Highlights: ${PROFILE.highlights.join("; ")}
- Ask me about: ${PROFILE.askMeAbout.join(", ")}

Return exactly this JSON structure:
{
  "bio": "2 short paragraphs in markdown. Professional, confident tone. Mention MERN, cloud, real-time systems, and 80K+ users. Use **bold** for key terms. No greeting line starting with 'Hi'.",
  "quote": "One original motivational quote for developers (max 20 words). No attribution.",
  "techTip": "One practical dev tip related to their stack (React, Node, WebSockets, AWS, Docker, Redis, or MongoDB). Format as a single blockquote line starting with > **Tip:**"
}`;
}

async function generateWithOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a technical writer for developer portfolios. Respond with valid JSON only.",
      },
      { role: "user", content: buildPrompt() },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(content);

  if (!parsed.bio || !parsed.quote || !parsed.techTip) {
    throw new Error("OpenAI response missing required fields");
  }

  return {
    AI_BIO: parsed.bio.trim(),
    AI_QUOTE: parsed.quote.trim(),
    AI_TECH_TIP: parsed.techTip.trim(),
  };
}

function replacePlaceholders(template, values) {
  let output = template;

  for (const key of PLACEHOLDERS) {
    const placeholder = `{{${key}}}`;
    const value = values[key] ?? FALLBACKS[key];
    output = output.split(placeholder).join(value);
  }

  output = output.split("{{LAST_UPDATED}}").join(formatDate());

  return output;
}

function readTemplate() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template not found at ${TEMPLATE_PATH}`);
  }
  return fs.readFileSync(TEMPLATE_PATH, "utf8");
}

async function main() {
  console.log("🚀 Generating dynamic README content...\n");

  const template = readTemplate();
  let values = { ...FALLBACKS };

  try {
    const generated = await generateWithOpenAI();
    values = { ...values, ...generated };
    console.log("✅ OpenAI content generated successfully");
  } catch (error) {
    console.warn(`⚠️  OpenAI failed: ${error.message}`);
    console.warn("📋 Using fallback content instead\n");
  }

  const updatedReadme = replacePlaceholders(template, values);

  fs.writeFileSync(README_PATH, updatedReadme, "utf8");
  console.log(`📝 README updated at ${README_PATH}`);
  console.log(`📅 Last updated: ${formatDate()}`);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
