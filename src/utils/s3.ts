import { AWSError, S3 } from "aws-sdk";
import { PutObjectOutput } from "aws-sdk/clients/s3";
import { io } from "../..";
import log from "./logger";
import fs from "fs";
import path from "path";
export async function UploadToS3(file: Express.Multer.File, socketId: string) {
  return new Promise<{ fileKey: string } & PutObjectOutput>((res, rej) => {
    const s3 = new S3({
      region: "eu-north-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET || "",
      },
    });

    const fileKey = `uploads/${Date.now().toString()}${file.originalname.replace(
      " ",
      "-"
    )}`;
    const params = {
      Bucket: process.env.BUCKET_NAME || "",
      Key: fileKey,
      Body: file.buffer,
    };

    s3.upload(params, {}, (err, data) => {
      if (err) {
        io.to(socketId).emit("upload-error", {
          error: err,
        });
        rej(err);
      }
      io.to(socketId).emit("upload-complete", {
        ok: true,
      });
      res({
        ...data,
        fileKey: fileKey,
      });
    }).on("httpUploadProgress", (progress) => {
      let sentProg = ((progress.loaded * 100) / progress.total).toString();

      io.to(socketId).emit("upload-progress", {
        progress: sentProg,
      });
      log.info("uploading to S3.... ", parseInt(sentProg), " %");
    });
  });
}

export function getS3Url(file_key: string) {
  const url = `https://${process.env.BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${file_key}`;
  return url;
}

export async function dowloadS3(fileKey: string) {
  try {
    const s3 = new S3({
      region: "eu-north-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || "",
        secretAccessKey: process.env.AWS_SECRET || "",
      },
    });
    const params: S3.PutObjectRequest = {
      Bucket: process.env.BUCKET_NAME || "",
      Key: fileKey,
    };
    const obj = await s3.getObject(params).promise();
    const tempDir = path.join(
      process.env.TEMP || process.env.TMP || "C:\\Temp",
      "pdf-temp"
    );
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate a unique filename
    const fileName = path.join(tempDir, `pdf-${Date.now()}.pdf`);

    fs.writeFileSync(fileName, obj.Body as Buffer);
    return fileName;
  } catch (e) {
    throw e;
  }
}
