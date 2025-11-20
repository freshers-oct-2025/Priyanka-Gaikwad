import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "No token provided" });

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;
    req.role = decoded.role;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
