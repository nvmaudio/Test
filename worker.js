export default {
  async fetch(req, env) {
    return new Response(
      await page(env),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
};

async function page(env) {
  const list = await env.BUCKET.list();

  const items = list.objects
    .filter(o => /\.(png|jpe?g|webp|gif)$/i.test(o.key))
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
<title>Ảnh trong R2</title>
<style>
body {
  font-family: system-ui, sans-serif;
  padding: 20px;
  background: #f6f7f9;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
.item {
  display: block;
  text-decoration: none;
  color: #333;
  background: #fff;
  border-radius: 10px;
  padding: 10px;
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

<h2>📂 Ảnh trong R2</h2>

<div class="grid">
  ${items || "<p>Chưa có ảnh</p>"}
</div>

</body>
</html>
`;
}
