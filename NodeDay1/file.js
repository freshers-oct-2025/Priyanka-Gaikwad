console.log("Welcome");

const fs1 = require("fs");
fs1.writeFile("output.txt", "writing file", (err) => {
  if (err) {
    console.log("Error occured!");
  } else {
    console.log("Code Successful");
  }
});
