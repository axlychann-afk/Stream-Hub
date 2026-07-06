import { Router, type IRouter } from "express";
import axios from "axios";
import healthRouter from "./health";
import donghuaRouter from "./donghua/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/donghua", donghuaRouter);

// Image proxy — fetches CDN images server-side to bypass hotlink protection
router.get("/image-proxy", async (req, res) => {
  const url = String(req.query.url ?? "").trim();
  if (!url || !/^https?:\/\//.test(url)) {
    res.status(400).json({ error: "Invalid url parameter" });
    return;
  }
  try {
    const upstream = await axios.get(url, {
      responseType: "stream",
      timeout: 10000,
      headers: {
        "Referer": "https://anichin.moe/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const ct = upstream.headers["content-type"] ?? "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");
    upstream.data.pipe(res);
  } catch {
    res.status(502).json({ error: "Failed to fetch image" });
  }
});

export default router;
