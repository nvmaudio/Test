export default {
  async fetch(req, env) {
    try {
      return await handle(req, env);
    } catch (e) {
      return new Response(
        "Worker error:\n" + e.message,
        { status: 500 }
      );
    }
  }
};

async function handle(req, env) {
  if (!env.Michio) {
    throw new Error("R2 bucket not bound");
  }

  const url = new URL(req.url);

  // ===== UPLOAD =====
  if (req.method === "POST") {
    let form;
    try {
      form = await req.formData();
    } catch {
      return new Response("Invalid form data", { status: 400 });
    }

    const file = form.get("file");
    if (!file) {
      return new Response("No file", { status: 400 });
    }

    const ext = file.name.includes(".")
      ? file.name.split(".").pop()
      : "bin";

    const key = `files/${crypto.randomUUID()}.${ext}`;

    await env.Michio.put(
      key,
      await file.arrayBuffer(),
      {
        httpMetadata: {
          contentType:
            file.type || "application/octet-stream"
        }
      }
    );

    return Response.redirect("/", 302);
  }

  // ===== LIST FILE =====
  if (url.pathname === "/list") {
    const list = await env.Michio.list({
      prefix: "files/"
    });

    return new Response(
      JSON.stringify(
        list.objects.map(o => ({
          name: o.key.split("/").pop(),
          url: "/file/" + o.key
        }))
      ),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // ===== SERVE FILE =====
  if (url.pathname.startsWith("/file/")) {
    const key = url.pathname.replace("/file/", "");
    const obj = await env.Michio.get(key);

    if (!obj) {
      return new Response("Not found", { status: 404 });
    }

    const type =
      obj.httpMetadata?.contentType ||
      "application/octet-stream";

    const inline =
      type.startsWith("image/") ||
      type.startsWith("text/") ||
      type === "application/pdf";

    return new Response(obj.body, {
      headers: {
        "Content-Type": type,
        "Content-Disposition": inline
          ? "inline"
          : \`attachment; filename="\${key.split("/").pop()}"\`
      }
    });
  }

  // ===== HTML UI =====
  return new Response(html(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}

function html() {
  return `
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Upload file R2</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>
:root {
  --bg: #f6f7fb;
  --card: #ffffff;
  --primary: #4f46e5;
  --text: #1f2937;
  --muted: #6b7280;
  --border: #e5e7eb;
  --radius: 12px;
}

* { box-sizing: border-box }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
}

.container {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 16px;
}

.card {
  background: var(--card);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  margin-bottom: 24px;
}

h1 {
  margin: 0 0 16px;
  font-size: 22px;
}

h2 {
  margin: 0 0 12px;
  font-size: 18px;
}

.upload-box {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

input[type="file"] {
  padding: 10px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: #fafafa;
  flex: 1;
}

button {
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius);
  background: var(--primary);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

button:hover {
  opacity: 0.9;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.file-item:last-child {
  border-bottom: none;
}

.file-name {
  color: var(--text);
  text-decoration: none;
  word-break: break-all;
}

.file-name:hover {
  text-decoration: underline;
}

.badge {
  font-size: 12px;
  color: var(--muted);
}

.empty {
  text-align: center;
  color: var(--muted);
  padding: 16px;
}

@media (max-width: 600px) {
  .upload-box {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
</head>

<body>
<div class="container">

  <div class="card">
    <h1>📦 Upload file</h1>
    <form method="post" enctype="multipart/form-data">
      <div class="upload-box">
        <input type="file" name="file">
        <button>Upload</button>
      </div>
    </form>
  </div>

  <div class="card">
    <h2>📂 File đã upload</h2>
    <ul id="files" class="file-list">
      <li class="empty">Đang tải danh sách…</li>
    </ul>
  </div>

</div>

<script>
fetch("/list")
  .then(r => r.json())
  .then(files => {
    const el = document.getElementById("files");

    if (!files.length) {
      el.innerHTML =
        '<li class="empty">Chưa có file nào</li>';
      return;
    }

    el.innerHTML = files.map(f => \`
      <li class="file-item">
        <a class="file-name" href="\${f.url}" target="_blank">
          \${f.name}
        </a>
        <span class="badge">open</span>
      </li>
    \`).join("");
  });
</script>

</body>
</html>
`;
}
