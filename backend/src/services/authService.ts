import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { signToken } from "../utils/jwt";
import { AppError } from "../middleware/errorHandler";
import type { AuthResponse, JwtPayload } from "../models/types";
import { Role } from "../models/types";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Authenticate user
export async function login(
    email: string,
    password: string
): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        throw new AppError("Invalid email or password", 401);
    }

    const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role as Role,
    };

    const token = signToken(payload);

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role as Role,
        },
    };
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}
