
APIurl = "http://localhost:8000/api";
const fetch = require("node-fetch");


async function getAllMatchesInDB() {
  return fetch(`${APIurl}/matches`).then((matches) => {
     return matches.json();
  });
}
  
// getAllMatchesInDB().then((output) => {
//   console.log(output);
// });

exports.getAllMatchesInDB = getAllMatchesInDB