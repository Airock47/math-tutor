import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const STEP_COLORS = ["#FF6B6B", "#FF9F43", "#54A0FF", "#5F27CD", "#00D2D3"];
const STEP_EMOJIS = ["🔍", "💡", "✏️", "🧮", "🎯", "✅"];

function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader 失敗"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image 載入失敗"));
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / Math.max(img.width, img.height, 1));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          const out = canvas.toDataURL("image/jpeg", quality);
          const b64 = out.split(",")[1];
          resolve({ b64, w, h, kb: Math.round(b64.length * 0.75 / 1024) });
        } catch (err) { reject(new Error("Canvas: " + err.message)); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function StepCard({ step, index, visible, isActive, onClick, total }) {
  const color = STEP_COLORS[index % STEP_COLORS.length];
  const emoji = STEP_EMOJIS[index % STEP_EMOJIS.length];
  return (
    <div onClick={onClick} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
      transition: `opacity 0.45s ease ${index * 0.1}s, transform 0.45s ease ${index * 0.1}s`,
      background: isActive ? "#fff" : "#f8f9ff",
      border: `2.5px solid ${isActive ? color : "#eaecf4"}`,
      borderRadius: 20, padding: "18px 20px", marginBottom: 12,
      boxShadow: isActive ? `0 10px 32px ${color}40` : "0 2px 8px rgba(0,0,0,0.04)",
      cursor: "pointer", position: "relative", overflow: "hidden",
    }}>
      {isActive && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: color, borderRadius: "20px 0 0 20px" }} />}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: isActive ? color : "#eaecf4",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, boxShadow: isActive ? `0 4px 14px ${color}55` : "none",
          transition: "all 0.3s",
        }}>{emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: isActive ? "#1a1a2e" : "#999", marginBottom: isActive ? 10 : 0, transition: "color 0.2s" }}>
            第 {index + 1} 步：{step.title}
          </div>
          {isActive && (
            <div>
              <div style={{
                fontSize: 16, color: "#2c2c54", lineHeight: 1.85,
                background: `${color}0d`, borderRadius: 12,
                padding: "12px 14px", marginBottom: step.formula ? 10 : 0, fontWeight: 500,
              }}>{step.content}</div>
              {step.formula && (
                <div style={{ background: `${color}18`, border: `2px solid ${color}66`, borderRadius: 14, padding: "14px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>算式</div>
                  <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 28, color, letterSpacing: 3 }}>{step.formula}</div>
                </div>
              )}
              {step.tip && (
                <div style={{ marginTop: 10, background: "#fffbe6", border: "1.5px solid #ffe58f", borderRadius: 12, padding: "10px 14px", fontSize: 14, color: "#7c5000", lineHeight: 1.6 }}>
                  💬 {step.tip}
                </div>
              )}
              {index === total - 1 && (
                <div style={{ marginTop: 10, background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "10px 14px", fontSize: 15, color: "#166534", fontWeight: 700, textAlign: "center" }}>
                  🎊 太棒了，這題解出來了！
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState("text");
  const [question, setQuestion] = useState("");
  const [preview, setPreview] = useState(null);
  const [imgData, setImgData] = useState(null);
  const [imgStatus, setImgStatus] = useState("");
  const [steps, setSteps] = useState([]);
  const [shown, setShown] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();
  const timerRef = useRef();
  const loadingMsgs = ["🔍 正在看題目...", "🧠 思考解法中...", "✏️ 整理步驟中...", "🎨 準備說明..."];
  const loadingIdx = useRef(0);

  const resetResult = () => { setSteps([]); setShown([]); setActive(0); setError(null); setAutoPlay(false); setDone(false); };
  const resetAll = () => { resetResult(); setQuestion(""); setPreview(null); setImgData(null); setImgStatus(""); };

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    resetResult(); setImgStatus("⏳ 處理圖片中...");
    try {
      const r = await compressImage(file, 800, 0.7);
      setPreview("data:image/jpeg;base64," + r.b64);
      setImgData(r.b64);
      setImgStatus(`✅ 圖片就緒（${r.kb}KB）`);
    } catch (e) { setError("圖片處理失敗：" + e.message); setImgStatus(""); }
  };

  const parseSteps = (raw) => {
    let parsed = null;
    try { parsed = JSON.parse(raw.trim()); } catch {}
    if (!Array.isArray(parsed)) {
      const m = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (m) try { parsed = JSON.parse(m[0]); } catch {}
    }
    if (!Array.isArray(parsed)) {
      const clean = raw.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim();
      try { parsed = JSON.parse(clean); } catch {}
    }
    return Array.isArray(parsed) ? parsed : null;
  };

  const solve = async () => {
    resetResult(); setLoading(true);
    loadingIdx.current = 0; setLoadingText(loadingMsgs[0]);
    const interval = setInterval(() => {
      loadingIdx.current = Math.min(loadingIdx.current + 1, loadingMsgs.length - 1);
      setLoadingText(loadingMsgs[loadingIdx.current]);
    }, 1800);

    try {
      let content;
      if (tab === "photo" && imgData) {
        content = [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imgData } },
          { type: "text", text: "請解這道數學題。" }
        ];
      } else {
        content = `請解這道數學題：「${question.trim()}」`;
      }

      // ── 第一次 API：完整解題（追求正確，不限格式） ──
      const res1 = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: `你是一位嚴謹的數學老師，請完整解答這道小學數學題。
要求：
1. 仔細看清楚題目的每個數字、圖形、條件，不要遺漏任何資訊
2. 判斷題型後用正確的解題方法作答
3. 寫出完整的解題過程和最終答案
4. 如果是填空題，把每個空格的答案都填出來
5. 如果是看圖題，根據圖上標示的數字計算
6. 用繁體中文回答`,
          messages: [{ role: "user", content }]
        })
      });

      const json1 = await res1.json();
      if (json1.error) throw new Error(json1.error.message || json1.error);
      if (!json1.content) throw new Error("沒有收到回應");
      const solution = json1.content.filter(b => b.type === "text").map(b => b.text).join("");

      // ── 第二次 API：把正確解法轉成小學生說法 ──
      const res2 = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: `你是一位親切的小學數學老師，語氣像大哥哥大姊姊。
你會收到一份「正確解題過程」，把它改寫成小學生（國小三到六年級）看得懂的步驟。

改寫規則：
- 用「我們」一起解題
- 語言簡單具體，避免艱深詞彙
- 保留所有正確的數字和計算，不能改變答案
- 每步說清楚「為什麼這樣做」

每步驟包含：
- title：3到6個字的步驟名稱
- content：2到4句話，用小學生能懂的方式說明
- formula：該步驟的算式，沒有就給空字串
- tip：一句鼓勵或記憶口訣（可省略）

分成 4 到 6 個步驟，只回傳 JSON 陣列，不要任何其他文字：
[{"title":"...","content":"...","formula":"...","tip":"..."}]`,
          messages: [{
            role: "user",
            content: `以下是這道題目的正確解題過程，請改寫成小學生看得懂的步驟：\n\n${solution}`
          }]
        })
      });

      const json2 = await res2.json();
      if (json2.error) throw new Error(json2.error.message || json2.error);
      if (!json2.content) throw new Error("沒有收到回應");

      const raw = json2.content.filter(b => b.type === "text").map(b => b.text).join("");
      const parsed = parseSteps(raw);
      if (!parsed) throw new Error("解析失敗，請再試一次");

      setSteps(parsed);
      parsed.forEach((_, i) => setTimeout(() => setShown(p => [...p, i]), i * 300 + 100));
    } catch (e) {
      setError(e.message);
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingText("");
    }
  };

  useEffect(() => {
    clearInterval(timerRef.current);
    if (autoPlay && steps.length > 0) {
      timerRef.current = setInterval(() => {
        setActive(prev => {
          if (prev >= steps.length - 1) { setAutoPlay(false); setDone(true); clearInterval(timerRef.current); return prev; }
          return prev + 1;
        });
      }, 3500);
    }
    return () => clearInterval(timerRef.current);
  }, [autoPlay, steps.length]);

  useEffect(() => {
    if (steps.length > 0 && active === steps.length - 1) setDone(true);
  }, [active, steps.length]);

  const canSolve = tab === "text" ? question.trim().length > 0 : !!imgData;
  const pct = steps.length > 0 ? ((active + 1) / steps.length) * 100 : 0;

  const examples = [
    "小明有48顆糖，平均分給6個朋友，每人幾顆？",
    "長方形長15公分、寬8公分，面積是多少？",
    "一箱蘋果有24個，買了7箱，共有幾個？",
    "567 + 389 = ?",
  ];

  return (
    <>
      <Head>
        <title>數學解題小幫手</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #1a1a4e 0%, #4a0080 50%, #c2185b 100%)", fontFamily: "'Noto Sans TC', sans-serif", paddingBottom: 60 }}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
          @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
          @keyframes spin { to{transform:rotate(360deg)} }
          textarea { resize: none; outline: none; }
          button { cursor: pointer; transition: opacity 0.15s, transform 0.15s; }
          button:active { opacity: 0.8; transform: scale(0.97); }
        `}</style>

        {/* Header */}
        <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.15)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#f093fb,#f5576c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 4px 15px rgba(240,93,251,0.4)", flexShrink: 0 }}>🧮</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>數學解題小幫手</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>專為小學生設計，一步一步學會解題 ✨</div>
          </div>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 0" }}>

          {/* Tabs */}
          {steps.length === 0 && !loading && (
            <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", borderRadius: 16, padding: 5, marginBottom: 16, gap: 4 }}>
              {[["text", "✏️ 輸入文字"], ["photo", "📷 上傳照片"]].map(([key, label]) => (
                <button key={key} onClick={() => { setTab(key); resetAll(); }}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: tab === key ? "rgba(255,255,255,0.95)" : "transparent", color: tab === key ? "#4a0080" : "rgba(255,255,255,0.75)", fontWeight: 800, fontSize: 14, fontFamily: "'Noto Sans TC', sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Input card */}
          {steps.length === 0 && !loading && (
            <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 24, padding: 22, marginBottom: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
              {tab === "text" ? (
                <>
                  <div style={{ fontWeight: 900, fontSize: 15, color: "#1a1a2e", marginBottom: 12 }}>📝 題目是什麼？</div>
                  <textarea value={question} onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && canSolve) { e.preventDefault(); solve(); } }}
                    placeholder={"把題目打在這裡，例如：\n小明有48顆糖，要分給6個朋友，每人幾顆？"}
                    rows={4}
                    style={{ width: "100%", border: "2px solid #e8eaf0", borderRadius: 14, padding: "13px 15px", fontSize: 16, color: "#2c2c54", fontFamily: "'Noto Sans TC', sans-serif", lineHeight: 1.65, background: "#f8f9ff", marginBottom: 8 }}
                    onFocus={e => e.target.style.border = "2px solid #7c3aed"}
                    onBlur={e => e.target.style.border = "2px solid #e8eaf0"}
                  />
                  <div style={{ fontSize: 12, color: "#c0c0d0", marginBottom: 14 }}>按 Enter 送出 · Shift+Enter 換行</div>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, color: "#9090b0", fontWeight: 700, marginBottom: 8 }}>💡 點範例快速試試：</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {examples.map((ex, i) => (
                        <button key={i} onClick={() => setQuestion(ex)}
                          style={{ background: "#f3f0ff", border: "1.5px solid #7c3aed33", borderRadius: 20, padding: "6px 13px", fontSize: 12.5, color: "#5b21b6", fontFamily: "'Noto Sans TC', sans-serif", fontWeight: 600 }}>
                          {ex.slice(0, 11)}…
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 900, fontSize: 15, color: "#1a1a2e", marginBottom: 12 }}>📷 拍下題目照片</div>
                  <div onClick={() => fileRef.current.click()}
                    onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                    onDragOver={e => e.preventDefault()}
                    style={{ border: preview ? "none" : "2.5px dashed #c5c9f0", borderRadius: 16, overflow: "hidden", background: preview ? "transparent" : "#f8f9ff", textAlign: "center", cursor: "pointer", marginBottom: 12, minHeight: preview ? 0 : 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                    {preview
                      ? <img src={preview} style={{ width: "100%", maxHeight: 280, objectFit: "contain", borderRadius: 14, display: "block" }} />
                      : <div style={{ padding: 24 }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
                        <div style={{ color: "#666", fontSize: 15, fontWeight: 700 }}>點這裡拍照或上傳圖片</div>
                        <div style={{ color: "#bbb", fontSize: 12, marginTop: 4 }}>手機可直接開相機</div>
                      </div>
                    }
                  </div>
                  {imgStatus && <div style={{ fontSize: 13, color: "#5b21b6", fontWeight: 700, marginBottom: 8 }}>{imgStatus}</div>}
                  {preview && <button onClick={() => { setPreview(null); setImgData(null); setImgStatus(""); }}
                    style={{ background: "#f5f5fb", border: "none", borderRadius: 10, padding: "7px 16px", fontSize: 13, color: "#666", marginBottom: 14 }}>
                    🔄 換一張照片
                  </button>}
                </>
              )}

              <button onClick={solve} disabled={!canSolve}
                style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "none", background: canSolve ? "linear-gradient(135deg,#7c3aed,#c2185b)" : "#e8eaf0", color: canSolve ? "#fff" : "#bbb", fontWeight: 900, fontSize: 17, fontFamily: "'Noto Sans TC', sans-serif", boxShadow: canSolve ? "0 8px 25px rgba(124,58,237,0.4)" : "none", animation: canSolve ? "pulse 2.5s ease-in-out infinite" : "none" }}>
                ✨ 幫我解這題！
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 24, padding: "32px 24px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize: 48, marginBottom: 16, display: "inline-block", animation: "spin 2s linear infinite" }}>⚙️</div>
              <div style={{ color: "#4a0080", fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{loadingText}</div>
              <div style={{ color: "#aaa", fontSize: 13 }}>請稍等一下，馬上好囉！</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#7c3aed", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: "#fff0f3", borderRadius: 16, padding: "16px 18px", color: "#be123c", fontWeight: 600, marginBottom: 14, fontSize: 14, border: "1.5px solid #fda4af" }}>
              😅 {error}
              <button onClick={() => { setError(null); resetResult(); }} style={{ marginLeft: 12, background: "none", border: "none", color: "#be123c", textDecoration: "underline", fontSize: 13 }}>再試一次</button>
            </div>
          )}

          {/* Steps */}
          {steps.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 24, padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: "#1a1a2e" }}>📚 解題步驟</div>
                <div style={{ fontSize: 13, color: "#aaa", fontWeight: 600 }}>{active + 1} / {steps.length} 步</div>
              </div>
              <div style={{ height: 7, background: "#f0f0f8", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#7c3aed,#c2185b)", borderRadius: 99, transition: "width 0.5s ease" }} />
              </div>
              {steps.map((s, i) => (
                <StepCard key={i} step={s} index={i} visible={shown.includes(i)} isActive={active === i} onClick={() => setActive(i)} total={steps.length} />
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: "2px solid #e8eaf0", background: "#fff", color: active === 0 ? "#d0d0e0" : "#7c3aed", fontWeight: 700, fontSize: 14, fontFamily: "'Noto Sans TC', sans-serif" }}>
                  ← 上一步
                </button>
                <button onClick={() => setAutoPlay(p => !p)}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: "none", background: autoPlay ? "#be123c" : "linear-gradient(135deg,#7c3aed,#c2185b)", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "'Noto Sans TC', sans-serif", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}>
                  {autoPlay ? "⏸ 暫停" : "▶ 自動播放"}
                </button>
                <button onClick={() => setActive(Math.min(steps.length - 1, active + 1))} disabled={active === steps.length - 1}
                  style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: "2px solid #e8eaf0", background: "#fff", color: active === steps.length - 1 ? "#d0d0e0" : "#7c3aed", fontWeight: 700, fontSize: 14, fontFamily: "'Noto Sans TC', sans-serif" }}>
                  下一步 →
                </button>
              </div>
              {done && (
                <div style={{ marginTop: 14, textAlign: "center", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "2px solid #86efac", borderRadius: 16, padding: "16px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>🏆</div>
                  <div style={{ color: "#166534", fontWeight: 900, fontSize: 17 }}>太厲害了！這題解出來了！</div>
                  <div style={{ color: "#16a34a", fontSize: 13, marginTop: 4 }}>繼續加油，你越來越棒了！</div>
                </div>
              )}
              <button onClick={resetAll} style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 13, border: "none", background: "#f5f5fb", color: "#aaa", fontWeight: 600, fontSize: 14, fontFamily: "'Noto Sans TC', sans-serif" }}>
                🔄 解新的題目
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
