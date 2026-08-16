import fs from "fs";
import path from "path";

const DATA_FILE = path.resolve(process.cwd(), "local_db.json");

interface LocalData {
  users: any[];
  tryOns: any[];
  garments: any[];
  wishlists: any[];
  outfits: any[];
  reviews: any[];
  styleProfiles: any[];
}

function loadData(): LocalData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("[LocalDb] Failed to load local_db.json, re-initializing:", e);
  }
  return {
    users: [
      { id: 1, openId: "local-dev-user", name: "Local Developer", email: "dev@local.host", role: "admin", lastSignedIn: new Date() }
    ],
    tryOns: [],
    garments: [
      { id: 1, name: "Classic White T-Shirt", category: "upper", imageUrl: "/uploads/garments/tshirt.png", price: 299, rating: 500, reviewCount: 12 },
      { id: 2, name: "Slim Fit Blue Jeans", category: "lower", imageUrl: "/uploads/garments/jeans.png", price: 599, rating: 480, reviewCount: 8 }
    ],
    wishlists: [],
    outfits: [],
    reviews: [],
    styleProfiles: []
  };
}

function saveData(data: LocalData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("[LocalDb] Failed to save local_db.json:", e);
  }
}

export const localDb = {
  getUsers: () => loadData().users,
  getUserByOpenId: (openId: string) => loadData().users.find(u => u.openId === openId),
  upsertUser: (user: any) => {
    const data = loadData();
    const idx = data.users.findIndex(u => u.openId === user.openId);
    if (idx >= 0) {
      data.users[idx] = { ...data.users[idx], ...user };
    } else {
      const newId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
      data.users.push({ id: newId, ...user });
    }
    saveData(data);
  },
  getGarments: () => loadData().garments,
  getGarmentById: (id: number) => loadData().garments.find(g => g.id === id),
  getTryOns: (userId: number) => loadData().tryOns.filter(t => t.userId === userId),
  createTryOn: (tryOn: any) => {
    const data = loadData();
    const newId = data.tryOns.length > 0 ? Math.max(...data.tryOns.map(t => t.id)) + 1 : 1;
    const item = { id: newId, createdAt: Date.now(), ...tryOn };
    data.tryOns.unshift(item);
    saveData(data);
    return item;
  }
};
