# Backend Learning

This is a repo of learning backend with javascript from chai and code (Hitesh Choudhary)

- Always use async await and try{} catch{} or Promises.then().catch() while connecting to database

- Whenever we have to use middleware or configure something then we use 'app.use()'
  e.g, app.use(cors())

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

- **JWT(jessonwebtoken)**: A JSON Web Token (JWT) is an open standard for securely transmitting information between parties as a JSON object.
  The information can be verified and trusted because it is digitally signed. JWTs are often used to represent claims or pieces of data, such as a user's identity or authorization status, in a way that can be verified and trusted by the recipient.

  A **JSON Web Token (JWT) is a bearer token**, meaning that anyone possessing this token can access the associated data. In other words, the token grants access to the data without requiring additional authentication or verification, as long as the token itself is valid.
