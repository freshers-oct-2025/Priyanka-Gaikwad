let promise = new Promise((resolve, reject) => {
  let success = true;
  if (success) {
    resolve("Task completed successfully!");
  } else {
    reject("Something went wrong!");
  }
});

promise
  .then((message) => console.log(message))
  .catch((error) => console.log(error));
