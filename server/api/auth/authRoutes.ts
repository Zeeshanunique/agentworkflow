import express from "express";
import passport from "passport";
import {
  loginController,
  registerController,
  logoutController,
  getMeController
} from "./authController";

const router = express.Router();

router.post("/login", (req, res, next) =>
  passport.authenticate("local", (err, user, info) =>
    loginController(req, res, next, err, user, info)
  )(req, res, next)
);

router.post("/register", registerController);
router.post("/logout", logoutController);
router.get("/me", getMeController);

export default router;
