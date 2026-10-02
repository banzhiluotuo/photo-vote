// 摄影作品投票 API —— Vercel Serverless Function
// 数据存储：Upstash Redis（Vercel 集成后会自动注入环境变量）
// 若未配置数据库，则退化为内存存储（仅供本地测试）

const REDIS_URL =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  "";
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  "";

const HASH_KEY = "photo_votes";     // Redis Hash: field=作品ID, value=票数
const TOTAL_WORKS = 51;

// 无数据库时的内存兜底
let memStore = null;

async function redisCmd(cmd) {
  const r = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  return j.result;
}

async function getVotes() {
  const out = {};
  for (let i = 1; i <= TOTAL_WORKS; i++) out[i] = 0;

  if (REDIS_URL && REDIS_TOKEN) {
    const res = await redisCmd(["HGETALL", HASH_KEY]);
    // Upstash 返回 ["1","5","2","3", ...]
    if (Array.isArray(res)) {
      for (let i = 0; i < res.length; i += 2) {
        out[res[i]] = parseInt(res[i + 1]) || 0;
      }
    }
    return out;
  }

  // 内存兜底
  if (!memStore) {
    memStore = {};
    for (let i = 1; i <= TOTAL_WORKS; i++) memStore[i] = 0;
  }
  return { ...memStore };
}

async function incVote(id) {
  if (REDIS_URL && REDIS_TOKEN) {
    await redisCmd(["HINCRBY", HASH_KEY, String(id), "1"]);
    return {
      votes: await getVotes(),
    };
  }
  if (!memStore) {
    memStore = {};
    for (let i = 1; i <= TOTAL_WORKS; i++) memStore[i] = 0;
  }
  memStore[id] = (memStore[id] || 0) + 1;
  return { votes: { ...memStore } };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === "GET") {
      const votes = await getVotes();
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ votes });
      return;
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      const id = parseInt(body && body.id);
      if (!id || id < 1 || id > TOTAL_WORKS) {
        res.status(400).json({ error: "invalid id" });
        return;
      }
      const result = await incVote(id);
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(result);
      return;
    }

    res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
