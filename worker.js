export default {
  async fetch(req, env) {
    if (req.method === "POST") {
      return upload(req, env);
    }

    return new Response(html(), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

async function upload(req, env) {
  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return new Response("No file", { status: 400 });
  }

  // Làm sạch tên file
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
        contentType: file.type
      }
    }
  );

  // Trả link ảnh PUBLIC
  const url = `https://img.nvmaudio.id.vn/${key}`;

  return new Response(
    JSON.stringify({ url }),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
}

function html() {
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Upload R2</title>
<style>
body{font-family:sans-serif;padding:40px}
img{max-width:300px;margin-top:20px;border:1px solid #ddd}
</style>
</head>
<body>

<h2>Upload ảnh</h2>

<input type="file" id="file">
<button onclick="upload()">Upload</button>

<div id="result"></div>

<script>
async function upload() {
  const f = document.getElementById("file").files[0];
  if (!f) return alert("Chọn file");

  const fd = new FormData();
  fd.append("file", f);

  const res = await fetch("/", {
    method: "POST",
    body: fd
  });

  const data = await res.json();

  document.getElementById("result").innerHTML =
    '<p>' + data.url + '</p>' +
    '<img src="' + data.url + '">';
}
</script>

</body>
</html>
`;
}
