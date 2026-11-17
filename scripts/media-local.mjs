import { open, stat } from "node:fs/promises";
import { getPlatformProxy } from "wrangler";

const file = process.argv[2];
if (!file) {
  console.error("Run npm run media:local -- <movie-path>.");
  process.exit(1);
}

const source = await stat(file);
if (!source.isFile() || !source.size) throw new Error("The movie path must point to a nonempty file.");

const proxy = await getPlatformProxy({ persist: true });
try {
  const key = "forrest-gump.mp4";
  const stored = await proxy.env.MEDIA.head(key);
  if (stored?.size === source.size && stored.customMetadata.modified === String(source.mtimeMs)) {
    console.log("The movie is already in local storage.");
  } else {
    const input = await open(file, "r");
    try {
      const movie = await proxy.env.MEDIA.createMultipartUpload(key, {
        httpMetadata: { contentType: "video/mp4" },
        customMetadata: { modified: String(source.mtimeMs) },
      });
      try {
        const partSize = 16 * 1024 * 1024;
        const parts = [];
        for (let offset = 0; offset < source.size; offset += partSize) {
          const part = Buffer.allocUnsafe(Math.min(partSize, source.size - offset));
          let filled = 0;
          while (filled < part.length) {
            const { bytesRead } = await input.read(part, filled, part.length - filled, offset + filled);
            if (!bytesRead) throw new Error("The movie file changed during the import.");
            filled += bytesRead;
          }
          parts.push(await movie.uploadPart(parts.length + 1, part));
          if (parts.length % 24 === 0) console.log(`Importing the movie: ${Math.floor(100 * (offset + part.length) / source.size)}%`);
        }
        const object = await movie.complete(parts);
        if (object.size !== source.size) throw new Error("The stored file size does not match the source.");
        console.log(`Movie ready in local R2 (${object.size.toLocaleString()} bytes).`);
      } catch (error) {
        await movie.abort().catch(() => undefined);
        throw error;
      }
    } finally {
      await input.close();
    }
  }
} finally {
  await proxy.dispose();
}
