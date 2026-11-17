import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

const file = process.argv[2];
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const sessionToken = process.env.R2_SESSION_TOKEN;
const Bucket = "sandyfave-media";
const Key = "forrest-gump.mp4";

if (!file || !account?.match(/^[0-9a-f]{32}$/i) || !accessKeyId || !secretAccessKey) {
  console.error("Run npm run media:upload -- <movie-path> with CLOUDFLARE_ACCOUNT_ID and the R2 S3 keys set.");
  process.exit(1);
}

const source = await stat(file);
if (!source.isFile() || !source.size) throw new Error("The movie path must point to a nonempty file.");

const client = new S3Client({
  region: "auto",
  endpoint: `https://${account}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey, sessionToken },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
try {
  const upload = new Upload({
    client,
    params: {
      Bucket, Key,
      Body: createReadStream(file),
      ContentLength: source.size,
      ContentType: "video/mp4",
    },
    partSize: 32 * 1024 * 1024,
    queueSize: 4,
  });
  let reported = -10;
  upload.on("httpUploadProgress", ({ loaded }) => {
    const percent = Math.floor(100 * (loaded ?? 0) / source.size);
    if (percent >= reported + 10) {
      console.log(`Uploading movie: ${percent}%`);
      reported = percent;
    }
  });
  await upload.done();
  const object = await client.send(new HeadObjectCommand({ Bucket, Key }));
  if (object.ContentLength !== source.size) throw new Error("The stored file size does not match the source.");
  console.log(`Uploaded ${source.size.toLocaleString()} bytes to the R2 bucket ${Bucket}.`);
} finally {
  client.destroy();
}
