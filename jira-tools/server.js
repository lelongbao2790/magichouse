import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
if (!process.env.JIRA_BASE_URL) {
  throw new Error("Missing JIRA_BASE_URL in .env");
}

if (!process.env.JIRA_EMAIL) {
  throw new Error("Missing JIRA_EMAIL in .env");
}

if (!process.env.JIRA_API_TOKEN) {
  throw new Error("Missing JIRA_API_TOKEN in .env");
}

const server = new Server(
  {
    name: "jira-tools",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const baseUrl = process.env.JIRA_BASE_URL;
const auth = {
  username: process.env.JIRA_EMAIL,
  password: process.env.JIRA_API_TOKEN,
};

function extractIssueKey(input) {
  const match = input.match(/[A-Z]+-\d+/);
  if (!match) throw new Error("Cannot find Jira issue key from input.");
  return match[0];
}

// ---------------------------------------------------------------------------
// Epic Link custom field discovery (classic/company-managed projects use a
// custom field for this; team-managed projects use the plain `parent` field).
// The field id is instance-wide, so cache it for the life of the process.
// ---------------------------------------------------------------------------
let epicLinkFieldIdCache;
async function getEpicLinkFieldId() {
  if (epicLinkFieldIdCache !== undefined) return epicLinkFieldIdCache;
  try {
    const res = await axios.get(`${baseUrl}/rest/api/3/field`, {
      auth,
      headers: { Accept: "application/json" },
    });
    const field = res.data.find((f) => f.name === "Epic Link");
    epicLinkFieldIdCache = field ? field.id : null;
  } catch {
    epicLinkFieldIdCache = null;
  }
  return epicLinkFieldIdCache;
}

// ---------------------------------------------------------------------------
// JQL search helper. Jira Cloud is sunsetting the old GET /rest/api/3/search
// in favor of POST /rest/api/3/search/jql (token-paginated). Try the new
// endpoint first and fall back to the legacy one so this keeps working
// regardless of which is live on the target instance.
// ---------------------------------------------------------------------------
async function jqlSearch(jql, fields) {
  const issues = [];
  let nextPageToken;
  let startAt = 0;
  let useLegacy = false;

  while (true) {
    if (!useLegacy) {
      try {
        const res = await axios.post(
          `${baseUrl}/rest/api/3/search/jql`,
          {
            jql,
            fields,
            maxResults: 100,
            ...(nextPageToken ? { nextPageToken } : {}),
          },
          {
            auth,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        issues.push(...(res.data.issues || []));
        if (!res.data.nextPageToken || res.data.issues.length === 0) break;
        nextPageToken = res.data.nextPageToken;
        continue;
      } catch (err) {
        if (err.response?.status === 404) {
          useLegacy = true;
          continue;
        }
        throw err;
      }
    }

    const res = await axios.get(`${baseUrl}/rest/api/3/search`, {
      auth,
      headers: { Accept: "application/json" },
      params: { jql, startAt, maxResults: 100, fields: fields.join(",") },
    });
    issues.push(...res.data.issues);
    startAt += res.data.issues.length;
    if (startAt >= res.data.total || res.data.issues.length === 0) break;
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Atlassian Document Format (ADF) -> readable Markdown-ish text.
// Keeps headings/lists/AC content intact and replaces inline `media` nodes
// with a reference to the downloaded attachment filename when known.
// ---------------------------------------------------------------------------
function renderAdf(doc, mediaMap = {}) {
  if (!doc || !doc.content) return "";
  return renderNodes(doc.content, mediaMap, 0)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderNodes(nodes, mediaMap, depth) {
  if (!nodes) return [];
  return nodes.flatMap((node) => renderNode(node, mediaMap, depth));
}

function renderNode(node, mediaMap, depth) {
  switch (node.type) {
    case "paragraph":
      return ["", renderInline(node.content, mediaMap)];
    case "heading": {
      const level = node.attrs?.level || 1;
      return ["", "#".repeat(level) + " " + renderInline(node.content, mediaMap)];
    }
    case "bulletList":
      return (node.content || []).flatMap((li) =>
        renderListItem(li, mediaMap, depth, "-")
      );
    case "orderedList":
      return (node.content || []).flatMap((li, i) =>
        renderListItem(li, mediaMap, depth, `${i + 1}.`)
      );
    case "taskList":
      return (node.content || []).flatMap((li) => {
        const checked = li.attrs?.state === "DONE" ? "x" : " ";
        return renderListItem(li, mediaMap, depth, `- [${checked}]`.replace(/^- /, ""));
      });
    case "codeBlock": {
      const code = (node.content || []).map((c) => c.text || "").join("");
      return ["```" + (node.attrs?.language || ""), code, "```"];
    }
    case "blockquote":
    case "panel": {
      const inner = renderNodes(node.content, mediaMap, depth);
      const prefix = node.type === "panel" ? `[${node.attrs?.panelType || "note"}] ` : "";
      return inner
        .filter((l) => l !== "")
        .map((l, i) => "> " + (i === 0 ? prefix : "") + l);
    }
    case "rule":
      return ["---"];
    case "mediaSingle":
    case "mediaGroup":
      return (node.content || []).flatMap((m) => renderNode(m, mediaMap, depth));
    case "media": {
      const id = node.attrs?.id;
      const file = mediaMap[id];
      return [file ? `[image: ${file}]` : `[image: ${node.attrs?.alt || id || "unknown"}]`];
    }
    case "table":
      return (node.content || []).flatMap((row) => renderTableRow(row, mediaMap));
    default:
      if (node.content) return renderNodes(node.content, mediaMap, depth);
      return [];
  }
}

function renderListItem(li, mediaMap, depth, marker) {
  const inner = renderNodes(li.content, mediaMap, depth + 1).filter((l) => l !== "");
  if (!inner.length) return [];
  const [first, ...rest] = inner;
  const indent = "  ".repeat(depth);
  return [`${indent}${marker} ${first}`, ...rest.map((l) => `${indent}  ${l}`)];
}

function renderTableRow(row, mediaMap) {
  const cells = (row.content || []).map((cell) =>
    renderNodes(cell.content, mediaMap, 0).join(" ").trim()
  );
  return [cells.join(" | ")];
}

function renderInline(content, mediaMap) {
  if (!content) return "";
  return content.map((n) => renderInlineNode(n, mediaMap)).join("");
}

function renderInlineNode(node, mediaMap) {
  switch (node.type) {
    case "text": {
      let t = node.text || "";
      for (const m of node.marks || []) {
        if (m.type === "strong") t = `**${t}**`;
        else if (m.type === "em") t = `_${t}_`;
        else if (m.type === "code") t = `\`${t}\``;
        else if (m.type === "link") t = `[${t}](${m.attrs?.href})`;
      }
      return t;
    }
    case "hardBreak":
      return "\n";
    case "mention":
      return `@${node.attrs?.text || node.attrs?.id || ""}`;
    case "emoji":
      return node.attrs?.shortName || "";
    case "inlineCard":
    case "blockCard":
      return node.attrs?.url || "";
    case "media":
      return renderNode(node, mediaMap, 0).join("\n");
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Attachment download helper. Returns { imageFiles, mediaMap } where
// mediaMap maps attachment id -> downloaded filename (used to resolve
// inline `media` nodes referenced from the description/comments body).
// ---------------------------------------------------------------------------
async function downloadImageAttachments(attachments, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const imageFiles = [];
  const mediaMap = {};

  for (const att of attachments) {
    const filename = att.filename || "";
    if (!filename.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/)) continue;

    const imageRes = await axios.get(att.content, {
      auth,
      responseType: "arraybuffer",
    });

    const safeName = filename.replace(/[^\w.\-]/g, "_");
    const filePath = path.join(outDir, safeName);
    fs.writeFileSync(filePath, imageRes.data);

    imageFiles.push(filePath);
    mediaMap[att.id] = safeName;
  }

  return { imageFiles, mediaMap };
}

// ---------------------------------------------------------------------------
// Tool schemas
// ---------------------------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_jira_ticket_with_images",
      description:
        "Fetch full Jira ticket detail: title, status, priority, description " +
        "(rendered to readable text, including Acceptance Criteria and inline " +
        "image references), parent/epic link, and image attachments downloaded " +
        "to disk.",
      inputSchema: {
        type: "object",
        properties: {
          jira_input: {
            type: "string",
            description: "Jira issue key or Jira URL",
          },
        },
        required: ["jira_input"],
      },
    },
    {
      name: "get_jira_comments",
      description:
        "Fetch all comments on a Jira ticket, newest first. Paginates through " +
        "the full comment history instead of relying on the issue's default " +
        "(possibly truncated) comment page.",
      inputSchema: {
        type: "object",
        properties: {
          jira_input: {
            type: "string",
            description: "Jira issue key or Jira URL",
          },
          max_comments: {
            type: "number",
            description: "Optional cap on number of comments returned (default: all)",
          },
        },
        required: ["jira_input"],
      },
    },
    {
      name: "get_jira_epic_issues",
      description:
        "Fetch all tickets linked to an epic, matching on both the classic " +
        "'Epic Link' field and the team-managed 'parent' field.",
      inputSchema: {
        type: "object",
        properties: {
          jira_input: {
            type: "string",
            description: "Epic issue key or Jira URL",
          },
        },
        required: ["jira_input"],
      },
    },
  ],
}));

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_jira_ticket_with_images") {
    return handleGetTicket(args);
  }
  if (name === "get_jira_comments") {
    return handleGetComments(args);
  }
  if (name === "get_jira_epic_issues") {
    return handleGetEpicIssues(args);
  }
  throw new Error("Unknown tool");
});

async function handleGetTicket(args) {
  const issueKey = extractIssueKey(args.jira_input);
  const epicLinkFieldId = await getEpicLinkFieldId();

  const fields = [
    "summary",
    "description",
    "comment",
    "attachment",
    "status",
    "issuetype",
    "priority",
    "parent",
    epicLinkFieldId,
  ].filter(Boolean);

  const issueUrl = `${baseUrl}/rest/api/3/issue/${issueKey}?fields=${fields.join(",")}`;
  const issueRes = await axios.get(issueUrl, {
    auth,
    headers: { Accept: "application/json" },
  });
  const issue = issueRes.data;

  const outDir = path.join(process.cwd(), "jira-output", issueKey);
  const { imageFiles, mediaMap } = await downloadImageAttachments(
    issue.fields.attachment || [],
    outDir
  );

  const parent = issue.fields.parent
    ? {
        key: issue.fields.parent.key,
        summary: issue.fields.parent.fields?.summary,
        issueType: issue.fields.parent.fields?.issuetype?.name,
      }
    : null;

  const comments = (issue.fields.comment?.comments || []).map((c) => ({
    author: c.author?.displayName,
    created: c.created,
    updated: c.updated,
    body: renderAdf(c.body, mediaMap),
  }));

  const result = {
    key: issue.key,
    title: issue.fields.summary,
    issueType: issue.fields.issuetype?.name,
    status: issue.fields.status?.name,
    priority: issue.fields.priority?.name,
    parent,
    epicKey: epicLinkFieldId ? issue.fields[epicLinkFieldId] || null : null,
    description: renderAdf(issue.fields.description, mediaMap),
    comments,
    imageFiles,
  };

  fs.writeFileSync(
    path.join(outDir, "ticket.json"),
    JSON.stringify(result, null, 2),
    "utf-8"
  );

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

async function handleGetComments(args) {
  const issueKey = extractIssueKey(args.jira_input);
  const maxComments = args.max_comments;

  const comments = [];
  let startAt = 0;
  const pageSize = 100;
  while (true) {
    const res = await axios.get(
      `${baseUrl}/rest/api/3/issue/${issueKey}/comment`,
      {
        auth,
        headers: { Accept: "application/json" },
        params: { startAt, maxResults: pageSize, orderBy: "-created" },
      }
    );
    comments.push(...res.data.comments);
    startAt += res.data.comments.length;
    if (startAt >= res.data.total || res.data.comments.length === 0) break;
    if (maxComments && comments.length >= maxComments) break;
  }

  const limited = maxComments ? comments.slice(0, maxComments) : comments;
  const result = {
    key: issueKey,
    count: limited.length,
    comments: limited.map((c) => ({
      id: c.id,
      author: c.author?.displayName,
      created: c.created,
      updated: c.updated,
      body: renderAdf(c.body),
    })),
  };

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

async function handleGetEpicIssues(args) {
  const epicKey = extractIssueKey(args.jira_input);
  const epicLinkFieldId = await getEpicLinkFieldId();

  const clauses = [`parent = "${epicKey}"`];
  if (epicLinkFieldId) clauses.push(`"Epic Link" = "${epicKey}"`);
  const jql = clauses.join(" OR ");
  const fields = ["summary", "status", "issuetype", "priority", "assignee"];

  let issues;
  try {
    issues = await jqlSearch(jql, fields);
  } catch (err) {
    if (err.response?.status === 400) {
      // Instance rejected one of the clauses (e.g. no Epic Link field
      // indexed for this project) — fall back to parent-only matching.
      issues = await jqlSearch(`parent = "${epicKey}"`, fields);
    } else {
      throw err;
    }
  }

  let epic = null;
  try {
    const epicRes = await axios.get(
      `${baseUrl}/rest/api/3/issue/${epicKey}?fields=summary,status`,
      { auth, headers: { Accept: "application/json" } }
    );
    epic = {
      key: epicRes.data.key,
      summary: epicRes.data.fields.summary,
      status: epicRes.data.fields.status?.name,
    };
  } catch {
    epic = { key: epicKey };
  }

  const result = {
    epic,
    count: issues.length,
    issues: issues.map((i) => ({
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status?.name,
      issueType: i.fields.issuetype?.name,
      priority: i.fields.priority?.name,
      assignee: i.fields.assignee?.displayName || null,
    })),
  };

  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

const transport = new StdioServerTransport();
await server.connect(transport);
