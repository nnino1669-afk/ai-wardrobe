import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const categories = [
  ["Underwear", "Everyday base layers and underwear", 1],
  ["Tops", "T-shirts, shirts, knitwear and blouses", 2],
  ["Bottoms", "Jeans, trousers, skirts and shorts", 3],
  ["Dresses", "One-piece dresses and jumpsuits", 4],
  ["Outerwear", "Coats, jackets and layers", 5],
  ["Formalwear", "Tailoring and complete formal looks", 6],
];

const categoryIds = new Map();
for (const [name, description, displayOrder] of categories) {
  await connection.execute(
    "INSERT INTO `garmentCategories` (`name`, `description`, `displayOrder`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `displayOrder` = VALUES(`displayOrder`)",
    [name, description, displayOrder],
  );
  const [rows] = await connection.execute(
    "SELECT `id` FROM `garmentCategories` WHERE `name` = ? LIMIT 1",
    [name],
  );
  categoryIds.set(name, rows[0].id);
}

const garments = [
  {
    category: "Underwear",
    name: "Neutral Everyday Set",
    description: "A comfortable neutral base layer for everyday styling.",
    imageUrl: "/manus-storage/catalog-underwear-set_9ca10627.jpg",
    clothType: "inner",
    color: "Sand",
    brand: "AI Wardrobe Essentials",
    price: 3900,
  },
  {
    category: "Tops",
    name: "Essential White T-Shirt",
    description: "A clean cotton staple with a relaxed everyday fit.",
    imageUrl: "/manus-storage/catalog-white-tshirt_df02f697.jpg",
    clothType: "upper",
    color: "White",
    brand: "AI Wardrobe Essentials",
    price: 2900,
  },
  {
    category: "Tops",
    name: "Sage Knit Top",
    description: "A soft long-sleeve knit with a refined everyday silhouette.",
    imageUrl: "/manus-storage/catalog-knit-top_62d946b3.jpg",
    clothType: "upper",
    color: "Sage",
    brand: "AI Wardrobe Essentials",
    price: 5900,
  },
  {
    category: "Bottoms",
    name: "Straight Blue Denim",
    description: "A classic straight-leg denim with a medium wash.",
    imageUrl: "/manus-storage/catalog-blue-jeans_ebb8ca50.jpg",
    clothType: "lower",
    color: "Medium blue",
    brand: "AI Wardrobe Denim",
    price: 7900,
  },
  {
    category: "Dresses",
    name: "Navy Satin Slip Dress",
    description: "An elegant one-piece silhouette with fluid satin drape.",
    imageUrl: "/manus-storage/catalog-slip-dress_471c8c38.jpg",
    clothType: "overall",
    color: "Navy",
    brand: "AI Wardrobe Studio",
    price: 10900,
  },
  {
    category: "Outerwear",
    name: "Tailored Black Blazer",
    description: "A structured single-breasted blazer for polished layering.",
    imageUrl: "/manus-storage/catalog-black-blazer_66c4af5f.jpg",
    clothType: "outer",
    color: "Black",
    brand: "AI Wardrobe Tailoring",
    price: 12900,
  },
  {
    category: "Outerwear",
    name: "Camel Wool Coat",
    description: "A long wool coat with a clean, tailored winter profile.",
    imageUrl: "/manus-storage/catalog-wool-coat_0116bffe.jpg",
    clothType: "outer",
    color: "Camel",
    brand: "AI Wardrobe Tailoring",
    price: 18900,
  },
  {
    category: "Formalwear",
    name: "Charcoal Three-Piece Suit",
    description: "A complete charcoal formal look with jacket, vest and trousers.",
    imageUrl: "/manus-storage/catalog-charcoal-suit_f75138c1.jpg",
    clothType: "overall",
    color: "Charcoal",
    brand: "AI Wardrobe Formal",
    price: 24900,
  },
];

for (const garment of garments) {
  const categoryId = categoryIds.get(garment.category);
  const [existingRows] = await connection.execute(
    "SELECT `id` FROM `garments` WHERE `name` = ? LIMIT 1",
    [garment.name],
  );
  const values = [
    categoryId,
    garment.name,
    garment.description,
    garment.imageUrl,
    garment.clothType,
    garment.color,
    "XS,S,M,L,XL,XXL",
    garment.price,
    garment.brand,
  ];

  if (existingRows.length > 0) {
    await connection.execute(
      "UPDATE `garments` SET `categoryId` = ?, `description` = ?, `imageUrl` = ?, `clothType` = ?, `color` = ?, `sizes` = ?, `price` = ?, `brand` = ?, `isActive` = 1 WHERE `id` = ?",
      [categoryId, garment.description, garment.imageUrl, garment.clothType, garment.color, "XS,S,M,L,XL,XXL", garment.price, garment.brand, existingRows[0].id],
    );
  } else {
    await connection.execute(
      "INSERT INTO `garments` (`categoryId`, `name`, `description`, `imageUrl`, `clothType`, `color`, `sizes`, `price`, `brand`, `rating`, `reviewCount`, `isActive`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1)",
      values,
    );
  }
}

await connection.end();
console.log(`Seeded ${categories.length} categories and ${garments.length} garments.`);
