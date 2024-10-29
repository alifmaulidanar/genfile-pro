require("dotenv").config();
const cors = require("cors");
const path = require("path");
const sharp = require("sharp");
const express = require("express");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const colorMapping = {
  red: { r: 255, g: 0, b: 0, alpha: 1 },
  green: { r: 0, g: 255, b: 0, alpha: 1 },
  blue: { r: 0, g: 0, b: 255, alpha: 1 },
  black: { r: 0, g: 0, b: 0, alpha: 1 },
  white: { r: 255, g: 255, b: 255, alpha: 1 },
};

const hexToRgba = (hex) => {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b, alpha: 1 };
};

const files = new Map();

// Generate file
app.post("/generate", async (req, res) => {
  const { fileType, fileSize, color, fileSizeUnit, width, height } = req.body;
  console.log("Processing file generation...");
  const backgroundColor = color.startsWith("#")
    ? hexToRgba(color)
    : colorMapping[color] || { r: 255, g: 255, b: 255, alpha: 1 };

  try {
    let targetSize =
      fileSizeUnit === "MB"
        ? parseInt(fileSize, 10) * 1024 * 1024
        : parseInt(fileSize, 10) * 1024;

    let safeColorName = color.replace("#", "_");
    let fileName = `${safeColorName}-${Date.now()}.${fileType}`;
    const fileId = Date.now().toString();

    if (fileType === "pdf") {
      const doc = new PDFDocument({ size: [width, height], margin: 0 });
      let buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => {
        let buffer = Buffer.concat(buffers);
        const paddingSize = targetSize - buffer.length;
        if (paddingSize > 0) {
          const paddingBuffer = Buffer.alloc(paddingSize, 0);
          buffer = Buffer.concat([buffer, paddingBuffer]);
        }
        files.set(fileId, { buffer, fileName });
        console.log(`File ${fileId} stored in memory`);

        // Set timeout delete buffer - 2 mins (120000 ms)
        setTimeout(() => {
          files.delete(fileId);
          console.log(`File ${fileId} deleted from memory after 2 minutes`);
        }, 120000);

        res.json({
          fileId: fileId,
          fileName: fileName,
          fileUrl: `http://localhost:3012/download/${fileId}`,
        });
      });

      doc
        .rect(0, 0, width, height)
        .fillColor(
          `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b})`
        )
        .fill();
      doc.end();
    } else if (fileType === "svg") {
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                          <rect width="100%" height="100%" fill="${color}" />
                        </svg>`;

      let buffer = Buffer.from(svgContent);
      const paddingSize = targetSize - buffer.length;

      if (paddingSize > 0) {
        const paddingString = " ".repeat(paddingSize);
        svgContent += `<!-- ${paddingString} -->`;
        buffer = Buffer.from(svgContent);
      }

      files.set(fileId, {
        buffer,
        fileName,
        svgContent,
      });
      console.log(`File ${fileId} stored in memory`);

      // Set timeout delete buffer - 2 mins (120000 ms)
      setTimeout(() => {
        files.delete(fileId);
        console.log(`File ${fileId} deleted from memory after 2 minutes`);
      }, 120000);

      res.json({
        fileId: fileId,
        fileName: fileName,
        fileUrl: `http://localhost:3012/download/${fileId}`,
        svgContent,
      });
    } else {
      let format = fileType === "jpg" ? "jpeg" : fileType;
      let buffer = await sharp({
        create: {
          width: parseInt(width, 10),
          height: parseInt(height, 10),
          channels: 4,
          background: backgroundColor,
        },
      })
        .toFormat(format)
        .toBuffer();

      const paddingSize = targetSize - buffer.length;
      if (paddingSize > 0) {
        const paddingBuffer = Buffer.alloc(paddingSize, 0);
        buffer = Buffer.concat([buffer, paddingBuffer]);
      }

      files.set(fileId, { buffer, fileName });
      console.log(`File ${fileId} stored in memory`);

      // Set timeout delete buffer - 2 mins (120000 ms)
      setTimeout(() => {
        files.delete(fileId);
        console.log(`File ${fileId} deleted from memory after 2 minutes`);
      }, 120000);

      res.json({
        fileId: fileId,
        fileName: fileName,
        fileUrl: `http://localhost:3012/download/${fileId}`,
      });
    }
  } catch (error) {
    console.error("Error generating file:", error);
    res.status(500).json({ message: "Error generating file." });
  }
});

// Download file
app.get("/download/:fileId", (req, res) => {
  const fileId = req.params.fileId;
  const fileData = files.get(fileId);

  if (!fileData) {
    console.error(
      `File with id ${fileId} not found or already deleted from memory`
    );
    return res
      .status(404)
      .send(
        "File not found or has already been deleted. Please regenerate the file."
      );
  }

  const { buffer, fileName } = fileData;
  const fileExtension = path.extname(fileName).toLowerCase();

  let contentType;
  let contentDisposition = "attachment";

  switch (fileExtension) {
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
    case ".jpeg":
      contentType = "image/jpeg";
      break;
    case ".svg":
      contentType = "image/svg+xml";
      break;
    case ".pdf":
      contentType = "application/pdf";
      contentDisposition = "inline";
      break;
    default:
      contentType = "application/octet-stream";
      break;
  }

  console.log(`Sending file ${fileId} with content type ${contentType}`);
  res.setHeader(
    "Content-Disposition",
    `${contentDisposition}; filename="${fileName}"`
  );
  res.setHeader("Content-Type", contentType);
  res.end(buffer, () => {
    console.log(
      `File ${fileId} sent, but not deleted from memory for testing.`
    );
  });
});

const port = process.env.PORT || 3012;
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
