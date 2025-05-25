const fs = require("fs");
const path = require("path");
const redisClient = require("./config/redis"); // adjust path if needed

const uploadDir = path.join(__dirname, "uploads");

fs.readdir(uploadDir, async (err, files) => {
  if (err) return console.error("Failed to read upload directory:", err);

  for (const file of files) {
    const sessionId = file.split("-")[0]; // assuming filename format is `${timestamp}-${originalname}`
    const filePath = path.join(uploadDir, file);

    const exists = await redisClient.get(sessionId);
    if (!exists) {
      fs.unlink(filePath, (err) => {
        if (!err) console.log(`Deleted orphaned file: ${file}`);
      });
    }
  }
});
