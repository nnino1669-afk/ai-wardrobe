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
  categories?: any[];
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
      { id: 1, name: "Classic White T-Shirt", categoryId: 2, category: "upper", clothType: "upper", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80", price: 299, rating: 500, reviewCount: 12, isActive: 1 },
      { id: 2, name: "Slim Fit Blue Jeans", categoryId: 3, category: "lower", clothType: "lower", imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80", price: 599, rating: 480, reviewCount: 8, isActive: 1 },
      { id: 3, name: "Silk Evening Gown", categoryId: 4, category: "dresses", clothType: "overall", imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80", price: 1899, rating: 495, reviewCount: 19, isActive: 1 },
      { id: 4, name: "Tailored Wool Suit", categoryId: 6, category: "formalwear", clothType: "overall", imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80", price: 3499, rating: 490, reviewCount: 24, isActive: 1 },
      { id: 5, name: "Classic Trench Coat", categoryId: 5, category: "outerwear", clothType: "outer", imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80", price: 1299, rating: 470, reviewCount: 15, isActive: 1 },
      { id: 6, name: "Cotton Boxer Briefs", categoryId: 1, category: "underwear", clothType: "inner", imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80", price: 199, rating: 460, reviewCount: 31, isActive: 1 },
      { id: 7, name: "Merino Wool Sweater", categoryId: 2, category: "upper", clothType: "upper", imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80", price: 799, rating: 485, reviewCount: 14, isActive: 1 },
      { id: 8, name: "Pleated Midi Skirt", categoryId: 3, category: "lower", clothType: "lower", imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80", price: 499, rating: 475, reviewCount: 9, isActive: 1 },
      { id: 9, name: "Leather Biker Jacket", categoryId: 5, category: "outerwear", clothType: "outer", imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80", price: 2499, rating: 492, reviewCount: 28, isActive: 1 },
      { id: 10, name: "Linen Summer Dress", categoryId: 4, category: "dresses", clothType: "overall", imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80", price: 899, rating: 488, reviewCount: 17, isActive: 1 },
      { id: 11, name: "Athletic Sports Bra & Leggings", categoryId: 1, category: "underwear", clothType: "inner", imageUrl: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=80", price: 599, rating: 490, reviewCount: 40, isActive: 1 },
      { id: 12, name: "Double-Breasted Tuxedo", categoryId: 6, category: "formalwear", clothType: "overall", imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80", price: 3999, rating: 498, reviewCount: 11, isActive: 1 }
    ],
    wishlists: [],
    outfits: [],
    reviews: [],
    styleProfiles: [],
    categories: [
      { id: 1, name: "Underwear & Basics", slug: "underwear", displayOrder: 1 },
      { id: 2, name: "Tops & Shirts", slug: "tops", displayOrder: 2 },
      { id: 3, name: "Bottoms & Trousers", slug: "bottoms", displayOrder: 3 },
      { id: 4, name: "Dresses & Gowns", slug: "dresses", displayOrder: 4 },
      { id: 5, name: "Outerwear & Jackets", slug: "outerwear", displayOrder: 5 },
      { id: 6, name: "Suits & Formalwear", slug: "formalwear", displayOrder: 6 }
    ]
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
  getGarments: () => {
    const data = loadData();
    return (data.garments || []).map((g: any) => ({
      ...g,
      clothType: g.clothType || (g.category === "lower" ? "lower" : "upper"),
      isActive: g.isActive ?? 1
    }));
  },
  getGarmentById: (id: number) => loadData().garments.find(g => g.id === id),
  getTryOns: (userId: number) => loadData().tryOns.filter(t => t.userId === userId),
  createTryOn: (tryOn: any) => {
    const data = loadData();
    const newId = data.tryOns.length > 0 ? Math.max(...data.tryOns.map(t => t.id)) + 1 : 1;
    const item = { id: newId, createdAt: Date.now(), ...tryOn };
    data.tryOns.unshift(item);
    saveData(data);
    return item;
  },
  getGarmentCategories: () => loadData().categories || [],
  getUserWishlist: (userId: number) => loadData().wishlists.filter(w => w.userId === userId),
  addToWishlist: (userId: number, garmentId: number) => {
    const data = loadData();
    if (!data.wishlists.some(w => w.userId === userId && w.garmentId === garmentId)) {
      data.wishlists.push({ userId, garmentId });
      saveData(data);
    }
    return true;
  },
  removeFromWishlist: (userId: number, garmentId: number) => {
    const data = loadData();
    data.wishlists = data.wishlists.filter(w => !(w.userId === userId && w.garmentId === garmentId));
    saveData(data);
    return true;
  }
};
