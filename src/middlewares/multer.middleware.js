import multer from "multer";
/**  crypto is a package in node.js
 * can be used to generate random string
 * here we can use it to generate uniqueFileName
 */
// import crypto from "crypto"
/** path is also a node.js package
 * and can be used to get extension of the file
 */
// import path from "path"

const storage = multer.diskStorage({
  /**  If no destination is given, the operating system's default directory for temporary files is used. */
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },

  /** If no filename is given, each file will be given a random name that doesn't include any file extension.
   * Note: Multer will not append any file extension for you,
   * your function should return a filename complete with an file extension.
   */
  filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //   cb(null, file.fieldname + '-' + uniqueSuffix)

    /** create random name for uploaded file
    crypto.randomBytes(12, function(err, bytes) {
      // bytes is in buffer so we convert it to hexadecimal
      const fn = bytes.toString("hex") + path.extname(file.originalname)
      cb(null, fn)
    })
    */

    /** fieldname: string;
     * fieldname -> Name of the form field associated with this file.
     *
     * originalname: string;
     * originalname -> Name of the file on the uploader's computer.
     *  */
    cb(null, file.originalname);
  },
});

// export const upload = multer({ storage: storage });
export const upload = multer({
  storage,
  /** 
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    // A MIME (Multipurpose Internet Mail Extensions) type is a string identifier composed of 
    // two parts: a type and a subtype.
    // MIME types serve the same purpose as file extensions on operating systems.
    //  MIME types are used to identify the format of a file or data, 
    // enabling the browser or software to display or output the file correctly.
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
    */
});
