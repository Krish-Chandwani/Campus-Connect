import type { IClub } from "../models/Club";
import type { IEvent } from "../models/Event";
import type { IUser } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      club?: IClub;
      event?: IEvent;
    }
  }
}

export {};
