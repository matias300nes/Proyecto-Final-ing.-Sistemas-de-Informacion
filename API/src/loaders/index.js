const DataLoader = require("dataloader");
const db = require("../db");

exports.userLoader = new DataLoader(async (ids) => {
  const users = await db.User.findAll({
    where: {
      id: ids,
    },
  });
  return ids.map((id) => users.find((u) => u.id === id));
});

exports.productoLoader = new DataLoader(async (ids) => {
  const productos = await db.Producto.findAll({
    where: {
      id: [...new Set(ids)],
    },
  });
  return ids.map((id) => productos.find((e) => e.id === id));
}, { cache: false });
