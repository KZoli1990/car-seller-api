const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
const access_token = req.headers["authorization"];

 if (!access_token) return res.status(401).send("Access denied! no token provided.");

 const splitToken = access_token.split(' ');
 if (splitToken.length !== 2) return res.status(401).send("Access denied! invalid token.");

 const token = splitToken[1];
 ///res.cookie("token", "", { httpOnly: true, expires: new Date(0) })

 try {
   const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
   req.receive = decoded;
   next();
 } catch (error) {
  if (error.name === "JsonWebTokenError" && error.message === "invalid signature") {
    // JSON Web Token hiba: érvénytelen aláírás
    return res.status(401).send("Access denied! invalid token signature.");
  }
  console.error(error);
  res.status(500).send("Internal Server Error");
 }
};

module.exports = authenticate;