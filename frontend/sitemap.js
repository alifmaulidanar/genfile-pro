import { SitemapStream, streamToPromise } from "sitemap";
import fs from "fs";

async function generateSitemap() {
  const sitemap = new SitemapStream({
    hostname: "https://genfilepro.alifmaulidanar.com",
  });

  sitemap.write({ url: "/", changefreq: "weekly", priority: 1.0 });
  sitemap.end();

  const data = await streamToPromise(sitemap);
  fs.writeFileSync("./public/sitemap.xml", data);
  console.log("Sitemap has been generated!");
}

generateSitemap();
