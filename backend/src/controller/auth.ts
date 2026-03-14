import { Request, Response } from "express";
import User from "../model/User.js";

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // Validate confirm password
    if (!password || !confirmPassword || password !== confirmPassword) {
      res.status(400).json({
        code: 400,
        status: 0,
        error: "Password and Confirm Password do not match",
        payload: null,
      });
      return;
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        code: 409,
        status: 0,
        error: "Email already registered",
        payload: null,
      });
      return;
    }

    // Save user with plain-text password (no encryption)
    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({
      code: 201,
      status: 1,
      error: null,
      payload: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: 0,
      error: (error as Error).message,
      payload: null,
    });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        code: 404,
        status: 0,
        error: "User not found",
        payload: null,
      });
      return;
    }

    // Plain text password comparison (no hashing)
    if (user.password !== password) {
      res.status(401).json({
        code: 401,
        status: 0,
        error: "Invalid password",
        payload: null,
      });
      return;
    }

    res.status(200).json({
      code: 200,
      status: 1,
      error: null,
      payload: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: 0,
      error: (error as Error).message,
      payload: null,
    });
  }
};
