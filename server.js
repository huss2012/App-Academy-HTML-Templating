const http = require('http');
const fs = require("fs");

const dogs = [
  {
    dogId: 1,
    name: 'Fido',
    age: 2
  },
  {
    dogId: 2,
    name: 'Fluffy',
    age: 10
  }
];

let nextDogId = 3;

function getNewDogId() {
  const newDogId = nextDogId;
  nextDogId++;
  return newDogId;
}


function getContentType(fileName) {
  const ext = fileName.split(".")[1];
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "css":
      return "text/css";
    default:
      return "text/plain";
  }
}

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  if (req.method === "GET" && req.url.startsWith('/assets')) {
    const assetPath = req.url.split("/assets")[1];
    try {
      const resBody = fs.readFileSync("./assets" + assetPath);
      res.statusCode = 200;
      res.setHeader("Content-Type", getContentType(assetPath));
      res.write(resBody);
      return res.end();
    } catch {
      console.error("Cannot find asset", assetPath, "in assets folder");
    }
  }

  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  // When the request is finished processing the entire body
  req.on("end", () => {
    // Parsing the body of the request
    if (reqBody) {
      req.body = reqBody
        .split("&")
        .map((keyValuePair) => keyValuePair.split("="))
        .map(([key, value]) => [key, value.replace(/\+/g, " ")])
        .map(([key, value]) => [key, decodeURIComponent(value)])
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
      console.log(req.body);
    }

    // route handlers
    // GET /
    if (req.method === 'GET' && req.url === '/') {
      const htmlPage = fs.readFileSync("./views/index.html", 'utf-8');
      const resBody = htmlPage;

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.write(resBody);
      return res.end();
    }

    // Phase 1: GET /dogs
    if (req.method === 'GET' && req.url === '/dogs') {
      // Your code here
      //Read the file dogs.html:
      let htmlTemplate = fs.readFileSync("./views/dogs.html", "utf-8");
      let htmlPage = htmlTemplate.replace(/\#{dogsList}/g, dogs.map(dog => `<li>${dog.name}</li>`).join(''));
      //1.Set the res status code:
      res.statusCode = 200;
      //2.Set the header of the response:
      res.setHeader('Content-Type', 'text/html');
      //3.Write to the body of the res:
      // res.write(htmlPage);
      //4.End the res:
      return res.end(htmlPage);
    }

    // Phase 2: GET /dogs/new
    if (req.method === 'GET' && req.url === '/dogs/new') {
      // Your code here
      let htmlPage = fs.readFileSync('./views/create-dog.html', 'utf-8');
      //1.Set the status code:
      res.statusCode = 200;
      //2.Set the header of the res:
      res.setHeader('Content-Type', 'text/html');
      //3.Write to the body of the res:
      res.write(htmlPage);
      //4.End the res:
      return res.end();
    }

    // Phase 3: GET /dogs/:dogId
    if (req.method === 'GET' && req.url.startsWith('/dogs/')) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        const dogId = urlParts[2];
        const dog = dogs.find(dog => dog.dogId === Number(dogId));
        // Your code here
        let htmlTemplate = fs.readFileSync('./views/dog-details.html', 'utf-8');
        let htmlPage = htmlTemplate.replace(/\#{name}/g, dog.name).replace(/\#{age}/g, dog.age);
        //1.Set the status code of the res:
        res.statusCode = 200;
        //2.Set the header of the res:
        res.setHeader('Content-Type', 'text/html');
        //3.Write to the body of the res:
        res.write(htmlPage);
        //4.End the res:
        return res.end();
      }
    }

    // Phase 4: POST /dogs
    if (req.method === 'POST' && req.url === '/dogs') {
      // Your code here
      //Listenning to the request packates:
      let reqBody = "";
      req.on('data', (data) => {
        reqBody += data;
      })
      //Parsing the reqBody:
      if (reqBody) {
        req.body = reqBody
          .split('&')
          .map(keyValuePair => keyValuePair.split('='))
          .map(([key, value]) => [key, value.replace(/\+/g, " ")])
          .map(([key, value]) => [key, decodeURIComponent(value)])
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {})
      }
      //Add new dog to the server data:
      dogs.push({
        dogId: nextDogId,
        name: req.body.name,
        age: req.body.age
      })
      //1.Set the status code of the res;
      res.statusCode = 302;
      //2.Set the header of the res:
      res.setHeader('Location', `/dogs/${nextDogId}`);
      //Update the nexDogId:
      getNewDogId();
      //3.End the res:
      return res.end();
    }

    // Phase 5: GET /dogs/:dogId/edit
    if (req.method === 'GET' && req.url.startsWith('/dogs/')) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 4 && urlParts[3] === 'edit') {
        const dogId = urlParts[2];
        const dog = dogs.find(dog => dog.dogId === Number(dogId));//Object{dogId: 1, name: zzz, age: 24}
        // Your code here
        let htmlTemplate = fs.readFileSync('./views/edit-dog.html', 'utf-8');
        let htmlPage = htmlTemplate.replace(/\#{dogId}/g, dog.dogId).replace(/\#{name}/g, dog.name).replace(/\#{age}/g, dog.age);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.write(htmlPage);
        return res.end();
      }
    }
    if (req.method === "POST" && req.url.startsWith('/dogs/')) {
      const urlParts = req.url.split('/');//['', 'dogs', '3']
      //console.log(urlParts);
      if (urlParts.length === 3) {
        const dogId = Number(urlParts[2]);//3
        const dogIndex = dogs.findIndex(dog => dog.dogId === dogId);

        dogs[dogIndex].name = req.body.name;
        dogs[dogIndex].age = Number(req.body.age);
        console.log("The string body", req.body);
        res.statusCode = 302;
        res.setHeader('Location', `/dogs/${dogId}`);
        return res.end();
      }
    }

    // Phase 6: POST /dogs/:dogId
    if (req.method === 'POST' && req.url.startsWith('/dogs/')) {
      const urlParts = req.url.split('/');
      if (urlParts.length === 3) {
        const dogId = urlParts[2];
        const dog = dogs.find(dog => dog.dogId === Number(dogId));
        // Your code here
      }
    }

    // No matching endpoint
    const htmlPage = fs.readFileSync("./views/error.html", 'utf-8');
    const resBody = htmlPage
      .replace(/#{message}/g, 'Page Not Found');

    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html");
    res.write(resBody);
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
