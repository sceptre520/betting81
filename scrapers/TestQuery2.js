
APIurl = "http://localhost:8000/api";
const fetch = require("node-fetch");


async function getAllCategoriesInDB() {
  return fetch(`${APIurl}/categories`).then((categories) => {
     return categories.json();
  });
}
  
getAllCategoriesInDB().then((output) => {
  console.log(output);
});