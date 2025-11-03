function getData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(" Data received!");
    }, 2000);
  });
}

async function showData() {
  console.log("⏳ Fetching data...");
  let result = await getData(); 
  console.log(result);
  console.log("Done!");
}

showData();
