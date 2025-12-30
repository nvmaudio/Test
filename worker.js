export default {
  async fetch(req, env) {
    if (req.method === "POST") {
      return upload(req, env);
    }

    return new Response(html(), {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }
};

async function upload(req, env) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return new Response("No file", { status: 400 });
  }

  const safeName = file.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");

  const key = `uploads/${Date.now()}-${safeName}`;

  await env.BUCKET.put(
    key,
    await file.arrayBuffer(),
    {
      httpMetadata: {
        contentType: file.type || "application/octet-stream"
      }
    }
  );

  return new Response(
    JSON.stringify({
      url: `https://img.nvmaudio.id.vn/${key}`
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

function html() {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Upload R2</title>
</head>
<body>

<h2>Upload ảnh</h2>

<input type="file" id="file">
<button id="btn">Upload</button>

<pre id="log"></pre>
<img id="img" style="max-width:300px;display:none">

<script>
const WORKER_URL = location.origin; // ✅ đúng domain Worker

document.getElementById("btn").onclick = async () => {
  const f = document.getElementById("file").files[0];
  if (!f) return alert("Chọn file");

  const fd = new FormData();
  fd.append("file", f);

  document.getElementById("log").textContent = "Uploading...";

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      body: fd
    });

    const data = await res.json();

    document.getElementById("log").textContent = data.url;

    const img = document.getElementById("img");
    img.src = data.url;
    img.style.display = "block";
  } catch (e) {
    document.getElementById("log").textContent =
      "Upload error: " + e;
  }
};
</script>

</body>
</html>
`;
}
