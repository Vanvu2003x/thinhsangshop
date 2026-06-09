const UserService = require("../modules/user/user.service");
const { verifyToken } = require("../services/jwt.service");

const checkToken = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc không tồn tại" });
  }

  try {
    const tokenResult = verifyToken(token);

    if (!tokenResult.valid) {
      return res.status(403).json({ message: "Token không hợp lệ" });
    }

    req.user = tokenResult.decoded;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

const checkRoleMDW = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc không tồn tại" });
  }

  try {
    const tokenResult = verifyToken(token);
    if (!tokenResult.valid || !tokenResult.decoded) {
      return res.status(403).json({ message: "Token không hợp lệ" });
    }

    const userDecoded = tokenResult.decoded;
    let isAdmin = false;
    try {
      const user = await UserService.getUserById(userDecoded.id);
      if (user && user.role === 'admin') {
        isAdmin = true;
      }
    } catch (err) {
      console.error("Lỗi khi kiểm tra quyền:", err);

    }

    if (!isAdmin) {
      return res.status(403).json({ message: "Không đủ quyền hạn" });
    }

    req.user = userDecoded;
    next();
  } catch (error) {
    console.error("Lỗi middleware checkRoleMDW:", error);
    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

const checkIsAdmin = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  req.isAdmin = false;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return next();
  }

  try {
    const tokenResult = verifyToken(token);

    if (!tokenResult.valid || !tokenResult.decoded) {
      return next();
    }

    const userId = tokenResult.decoded.id;

    req.user = tokenResult.decoded;

    const user = await UserService.getUserById(userId);
    if (user && user.role === 'admin') {
      req.isAdmin = true;
    }
  } catch (err) {
    console.error("❌ Lỗi khi kiểm tra quyền admin:", err);
  }

  next();
};

const optionalAuth = async (req, res, next) => {
  req.userLevel = 1;
  req.isAdmin = false;

  try {
    let token = null;

    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return next();

    const tokenResult = verifyToken(token);
    if (!tokenResult.valid || !tokenResult.decoded) return next();

    req.user = tokenResult.decoded;

    const user = await UserService.getUserById(tokenResult.decoded.id);
    if (user) {
      req.userLevel = user.level || 1;
      req.isAdmin = user.role === 'admin';
    }
  } catch (err) {

    if (process.env.NODE_ENV !== 'production') {
      console.error("optionalAuth error (debug):", err.message);
    }
  }

  next();
};

module.exports = {
  checkToken,
  checkRoleMDW,
  checkIsAdmin,
  optionalAuth,
};