# Backend Learning

This is a repo of learning backend with javascript from chai and code (Hitesh Choudhary)

- Always use async await and try{} catch{} or Promises.then().catch() while connecting to database

- Whenever we have to use middleware or configure something then we use 'app.use()'
  e.g, app.use(cors())

  - use() is a method which runs function/middleware or configure just after matching of any route defined with the requested URL and after that other operations performed based on how it is defined.

  - use() is a method used to define middleware functions that can intercept requests and perform actions before passing control to the next middleware or the route handler.

    - **Global Middleware**: When you use .use() without specifying a route, it will apply the middleware to all incoming requests.
    - **Route-Specific Middleware**: You can also pass a route path as the first argument to .use(), making the middleware apply only to requests that match that path.

              When you "mount" middleware, you are telling your app to use a specific function or functions for a certain part of your website, like a specific URL.So, if a request comes in and the beginning of the requested URL matches the specified path, the middleware will be executed. If it doesn’t match, that middleware won’t run.

      This helps you organize your code and apply different behaviors depending on the URL.

- About '**BSON data**' :

  BSON stands for Binary Javascript Object Notation. It is a bin­ary-en­coded seri­al­iz­a­tion of JSON documents. BSON has been extended to add some optional non-JSON-native data types, like dates and binary data.
  How is BSON Different from JSON?

| Difference        | JSON                                                                                                           | BSON                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Type              | JSON files are written in text format.                                                                         | BSON files are written in binary.                                                                       |
| Speed             | JSON is fast to read but slower to build.                                                                      | BSON is slow to read but faster to build and scan.                                                      |
| Space             | JSON data is slightly smaller in byte size.                                                                    | BSON data is slightly larger in byte size.                                                              |
| Encode and Decode | We can send JSON through APIs without encoding and decoding.                                                   | BSON files are encoded before storing and decoded before displaying.                                    |
| Parse             | JSON is a human-readable format that doesn't require parsing.                                                  | BSON needs to be parsed as they are machine-generated and not human-readable.                           |
| Data Types        | JSON has a specific set of data types—string, boolean, number for numeric data types, array, object, and null. | Unlike JSON, BSON offers additional data types such as bindata for binary data, decimal128 for numeric. |
| Usage             | Used to send data through the network (mostly through APIs).                                                   | Databases use BSON to store data.                                                                       |

- **To upload file** : We will first use Multer to upload the file to our local server. Then, we'll take that file from our server and upload it to Cloudinary. This way, if any error happens during the upload to Cloudinary, we will still have the file stored locally and can try uploading it again.

- **fs in nodejs** : fs (File System) module is a built-in module that allows you to interact with the file system in a way that is both synchronous and asynchronous. This module provides APIs to read, write, update, delete, and manipulate files and directories on your system.
  Node.js also provides stream-based APIs for reading and writing large files efficiently without loading the entire file into memory.

- **HTTP STATUS CODE** :

  - 1xx : Informational responses
  - 2xx : Success responses
  - 3xx : Redirection messages
  - 4xx : Client error responses
  - 5xx : Server error responses

- **JWT(jessonwebtoken)**: A JSON Web Token (JWT) is an open standard for securely transmitting information between parties as a JSON object.
  The information can be verified and trusted because it is digitally signed. JWTs are often used to represent claims or pieces of data, such as a user's identity or authorization status, in a way that can be verified and trusted by the recipient.

  A **JSON Web Token (JWT) is a bearer token**, meaning that anyone possessing this token can access the associated data. In other words, the token grants access to the data without requiring additional authentication or verification, as long as the token itself is valid.

- **Access Token** :

  - short lifespan
  - validates the user using access token but it is not stored in database.
  - is a credential that grants access to protected resources or APIs on behalf of an authenticated user. It is issued after successful authentication and authorization, and typically used for short-lived, session-based access.
  - The server validates the access token by verifying its signature (in the case of JWTs), checking its expiration, and validating claims like the issuer and audience.

- **Refresh Token** :
  - longer lifespan
  - stored in database and given to client as well
  - Refresh tokens should be securely stored on the client-side, preferably in secure HTTP-only cookies or local storage, to reduce the risk of theft.
  - When the access token expires and the user attempts to perform an action that requires authorization, if a valid refresh token is available, the user won't need to log in again. Instead, they can simply request a new access token by hitting the appropriate endpoint.
  - Refresh tokens can be revoked by the server, requiring users to re-authenticate if the refresh token is invalidated (e.g., due to a password change or logout).

[!NOTE] read about Stateless Authentication

- Learn about mongodb operators
