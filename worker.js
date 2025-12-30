export default {
  async fetch(req, env) {
    if (req.method === "POST") {
      return handleUpload(req, env);
    }

    return new Response(html(), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

async function handleUpload(req, env) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return new Response("No file", { status: 400 });
  }

  const safeName = file.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");

  const key = `${Date.now()}-${safeName}`;

  await env.BUCKET.put(
    key,
    await file.arrayBuffer(),
    {
      httpMetadata: {
        contentType: file.type || "application/octet-stream"
      }
    }
  );

  // ❗ trả về HTML luôn (KHÔNG JSON)
  return new Response(`
    <script>
      location.href='/?img=${encodeURIComponent(key)}'
    </script>
  `, {
    headers: { "Content-Type": "text/html" }
  });
}

function html() {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Upload R2</title>
<style>
body{font-family:sans-serif;padding:30px}
img{max-width:300px;margin-top:20px;border:1px solid #ddd}
</style>
</head>
<body>

<h2>Upload ảnh</h2>

<form method="post" enctype="multipart/form-data">
  <input type="file" name="file" required>
  <button type="submit">Upload</button>
</form>

<div id="preview"></div>

<script>
const p = new URLSearchParams(location.search);
const img = p.get("img");

if (img) {
  document.getElementById("preview").innerHTML =
    '<p>https://img.nvmaudio.id.vn/' + img + '</p>' +
    '<img src="https://img.nvmaudio.id.vn/' + img + '">';
}
</script>

</body>
</html>
`;
}
