import type { IClub } from "../models/Club";
import type { IUser } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      club?: IClub;
    }
  }
}

export {};
