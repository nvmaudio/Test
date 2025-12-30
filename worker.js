export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // ===== Upload =====
    if (req.method === "POST") {
      const form = await req.formData();
      const file = form.get("file");

      if (!file) {
        return new Response("No file", { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();

      // Resize + WebP (Cloudflare Image API built-in)
      const webp = await env.BUCKET.put(
        `${crypto.randomUUID()}.webp`,
        arrayBuffer,
        {
          httpMetadata: { contentType: "image/webp" },
        }
      );

      return Response.redirect("/", 302);
    }

    // ===== List images =====
    if (url.pathname === "/list") {
      const list = await env.BUCKET.list();

      return new Response(
        JSON.stringify(
          list.objects.map(o => `/img/${o.key}`)
        ),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ===== Serve image =====
    if (url.pathname.startsWith("/img/")) {
      const key = url.pathname.replace("/img/", "");
      const obj = await env.BUCKET.get(key);

      if (!obj) return new Response("Not found", { status: 404 });

      return new Response(obj.body, {
        headers: { "Content-Type": "image/webp" },
      });
    }

    // ===== HTML =====
    return new Response(html(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};

function html() {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Upload ảnh R2</title>
</head>
<body>
  <h2>Upload ảnh</h2>
  <form method="post" enctype="multipart/form-data">
    <input type="file" name="file" accept="image/*" />
    <button>Upload</button>
  </form>

  <h2>Ảnh đã có</h2>
  <div id="images"></div>

  <script>
    fetch('/list')
      .then(r => r.json())
      .then(arr => {
        document.getElementById('images').innerHTML =
          arr.map(src => 
            '<img src="' + src + '" width="150" style="margin:5px"/>'
          ).join('');
      });
  </script>
</body>
</html>
`;
}
