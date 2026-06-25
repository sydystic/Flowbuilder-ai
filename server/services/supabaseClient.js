const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const isDemoMode = process.env.DEMO_MODE === "true";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mutex queues to resolve concurrent file lock issues in mock DB mode
const locks = {};
async function runLocked(tableName, fn) {
  if (!locks[tableName]) {
    locks[tableName] = Promise.resolve();
  }
  const nextLock = locks[tableName].then(async () => {
    try {
      return await fn();
    } catch (err) {
      console.error(`Error executing locked transaction for ${tableName}:`, err);
      throw err;
    }
  });
  locks[tableName] = nextLock.catch(() => {}); // prevent lock chain failure propagation
  return nextLock;
}

if (!isDemoMode && (!supabaseUrl || !supabaseServiceKey)) {
  console.error("FATAL ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment.");
  process.exit(1);
}

// Custom mock implementation of Supabase Client using local JSON files
class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.orderByField = null;
    this.orderByAsc = true;
    this.limitNum = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.action = "select";
    this.payload = null;
  }

  select() {
    if (this.action !== "insert" && this.action !== "update" && this.action !== "delete") {
      this.action = "select";
    }
    return this;
  }

  insert(payload) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(col, val) {
    this.filters.push({ col, val });
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.orderByField = col;
    this.orderByAsc = ascending;
    return this;
  }

  limit(n) {
    this.limitNum = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async execute() {
    return runLocked(this.tableName, async () => {
      const fs = require("fs");
      const dbDir = path.join(__dirname, "../data/local_db");
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      const filePath = path.join(dbDir, `${this.tableName}.json`);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
      }

      let raw = fs.readFileSync(filePath, "utf-8");
      let records = [];
      try {
        records = JSON.parse(raw);
      } catch (e) {
        records = [];
      }

      const uuid = () => require("crypto").randomUUID ? require("crypto").randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

      let result = [];

      if (this.action === "select") {
        result = [...records];
      } else if (this.action === "insert") {
        const itemsToInsert = Array.isArray(this.payload) ? this.payload : [this.payload];
        const insertedItems = itemsToInsert.map(item => {
          const newItem = {
            id: item.id || uuid(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...item
          };
          if (this.tableName === "users" && !newItem.auth_id) {
            newItem.auth_id = newItem.id;
          }
          return newItem;
        });
        records.push(...insertedItems);
        fs.writeFileSync(filePath, JSON.stringify(records, null, 2), "utf-8");
        result = insertedItems;
      } else if (this.action === "update") {
        const matchIndices = [];
        records.forEach((record, index) => {
          let match = true;
          for (const filter of this.filters) {
            if (record[filter.col] !== filter.val) {
              match = false;
              break;
            }
          }
          if (match) matchIndices.push(index);
        });

        const updatedRecords = [];
        matchIndices.forEach(idx => {
          records[idx] = {
            ...records[idx],
            ...this.payload,
            updated_at: new Date().toISOString()
          };
          updatedRecords.push(records[idx]);
        });

        fs.writeFileSync(filePath, JSON.stringify(records, null, 2), "utf-8");
        result = updatedRecords;
      } else if (this.action === "delete") {
        if (this.filters.length === 0) {
          console.error(`MockQueryBuilder: delete() called with no filters on table ${this.tableName} — refusing to wipe entire table`);
          return { data: null, error: { message: "delete() requires at least one .eq() filter" } };
        }
        const remaining = [];
        const deleted = [];
        records.forEach(record => {
          let match = true;
          for (const filter of this.filters) {
            if (record[filter.col] !== filter.val) {
              match = false;
              break;
            }
          }
          if (match) {
            deleted.push(record);
          } else {
            remaining.push(record);
          }
        });
        fs.writeFileSync(filePath, JSON.stringify(remaining, null, 2), "utf-8");
        result = deleted;
      }

      if (this.action === "select") {
        this.filters.forEach(filter => {
          result = result.filter(record => record[filter.col] === filter.val);
        });

        if (this.orderByField) {
          result.sort((a, b) => {
            let valA = a[this.orderByField];
            let valB = b[this.orderByField];
            if (valA === undefined) return 1;
            if (valB === undefined) return -1;
            if (typeof valA === "string") {
              return this.orderByAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return this.orderByAsc ? (valA - valB) : (valB - valA);
          });
        }

        if (this.limitNum !== null) {
          result = result.slice(0, this.limitNum);
        }
      }

      if (this.isSingle) {
        if (result.length === 0) {
          return { data: null, error: { message: "Record not found" } };
        }
        return { data: result[0], error: null };
      }

      if (this.isMaybeSingle) {
        return { data: result[0] || null, error: null };
      }

      return { data: result, error: null };
    });
  }

  then(onFulfilled, onRejected) {
    return Promise.resolve(this.execute()).then(onFulfilled, onRejected);
  }
}

const mockUser = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "demo@example.com",
  user_metadata: { full_name: "Demo User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString()
};

const mockSupabase = {
  auth: {
    async getUser(token) {
      const DEMO_TOKEN = process.env.DEMO_TOKEN || "demo-token";
      if (token !== DEMO_TOKEN) {
        return { data: { user: null }, error: { message: "Invalid demo token" } };
      }
      return { data: { user: mockUser }, error: null };
    }
  },
  from(tableName) {
    return new MockQueryBuilder(tableName);
  }
};

const supabase = isDemoMode
  ? mockSupabase
  : createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

module.exports = supabase;

