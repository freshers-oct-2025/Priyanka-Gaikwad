const http = require("http");

const server = http.createServer((req, res) => {
  console.log(req);
  res.end("hello from node.js server");
});
const port = 3000;
server.listen(port, () => {
  console.log(`server running on address : http://localhost:${port}`);
});
