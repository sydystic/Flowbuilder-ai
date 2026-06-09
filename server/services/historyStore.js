const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/history.json");

// Ensure directory exists
const dirPath = path.dirname(filePath);
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// Initialize file if not exists
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf8");
}

module.exports = {
  getAll() {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data || "[]");
    } catch (err) {
      console.error("Error reading history:", err);
      return [];
    }
  },

  save(item) {
    try {
      const history = this.getAll();
      const newItem = {
        id: item.n8nId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...item
      };
      history.push(newItem);
      fs.writeFileSync(filePath, JSON.stringify(history, null, 2), "utf8");
      return newItem;
    } catch (err) {
      console.error("Error saving history:", err);
      return null;
    }
  }
};
