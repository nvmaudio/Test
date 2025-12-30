export default {
  async fetch(req, env) {
    if (req.method === "POST") {
      return upload(req, env);
    }

    return new Response(
      await page(env),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
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

  // redirect về trang chính để thấy ảnh mới
  return new Response(
    `<script>location.href='/'</script>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

async function page(env) {
  const list = await env.Michio.list();

  const images = list.objects
    .filter(o => /\.(png|jpe?g|webp|gif)$/i.test(o.key))
    .sort((a, b) => b.uploaded - a.uploaded)
    .map(o => {
      const url = `https://img.nvmaudio.id.vn/${o.key}`;
      return `
        <a href="${url}" target="_blank" class="item">
          <img src="${url}" loading="lazy">
          <span>${o.key}</span>
        </a>
      `;
    })
    .join("");

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Upload & Xem ảnh R2</title>
<style>
body {
  font-family: system-ui, sans-serif;
  padding: 24px;
  background: #f4f6f8;
}
h2 {
  margin-bottom: 10px;
}
form {
  background: #fff;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
  margin-bottom: 24px;
}
button {
  padding: 6px 14px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
.item {
  display: block;
  background: #fff;
  padding: 10px;
  border-radius: 10px;
  text-decoration: none;
  color: #333;
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
  transition: transform .15s;
}
.item:hover {
  transform: translateY(-3px);
}
.item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
}
.item span {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  word-break: break-all;
}
</style>
</head>
<body>

<h2>⬆️ Upload ảnh</h2>

<form method="post" enctype="multipart/form-data">
  <input type="file" name="file" accept="image/*" required>
  <button type="submit">Upload</button>
</form>

<h2>🖼️ Ảnh trong R2</h2>

<div class="grid">
  ${images || "<p>Chưa có ảnh</p>"}
</div>

</body>
</html>
`;
}
