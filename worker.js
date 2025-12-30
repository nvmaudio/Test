export default {
  async fetch(req, env) {
    try {
      return await router(req, env);
    } catch (e) {
      return new Response(
        "Worker crashed:\n" + (e && e.message),
        { status: 500 }
      );
    }
  }
};

async function router(req, env) {
  // ===== CHECK R2 =====
  if (!env || !env.Michio) {
    return new Response(
      "R2 binding Michio NOT FOUND",
      { status: 500 }
    );
  }

  const url = new URL(req.url);

  // ===== UPLOAD =====
  if (req.method === "POST") {
    let form;
    try {
      form = await req.formData();
    } catch (e) {
      return new Response(
        "formData() failed",
        { status: 400 }
      );
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response(
        "Invalid file",
        { status: 400 }
      );
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

    return new Response(
      "<script>location.href='/'</script>",
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // ===== LIST =====
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

  // ===== FILE =====
  if (url.pathname.startsWith("/file/")) {
    const key = url.pathname.slice(6);
    const obj = await env.Michio.get(key);

    if (!obj) {
      return new Response("Not found", { status: 404 });
    }

    const type =
      obj.httpMetadata?.contentType ||
      "application/octet-stream";

    return new Response(obj.body, {
      headers: {
        "Content-Type": type,
        "Content-Disposition": "inline"
      }
    });
  }

  // ===== UI =====
  return new Response(html(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}

function html() {
  return `
<!doctype html>
<html>
<body style="font-family:sans-serif;padding:20px">
<h2>Upload file</h2>
<form method="post" enctype="multipart/form-data">
  <input type="file" name="file">
  <button>Upload</button>
</form>

<h3>Files</h3>
<ul id="list"></ul>

<script>
fetch("/list")
  .then(r => r.json())
  .then(arr => {
    document.getElementById("list").innerHTML =
      arr.map(f =>
        '<li><a href="' + f.url +
        '" target="_blank">' +
        f.name +
        '</a></li>'
      ).join("");
  });
</script>
</body>
</html>
`;
}
