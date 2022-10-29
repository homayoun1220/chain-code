import { Context, Contract } from "fabric-contract-api";
import { User } from "./user";
export declare class UserContract extends Contract {
    userExists(ctx: Context, userId: string): Promise<boolean>;
    createUser(ctx: Context, userId: string, EnrollmentID: string): Promise<void>;
    readUser(ctx: Context, userId: string): Promise<User>;
    queryAllUsers(ctx: Context): Promise<string>;
    getEnrollID(ctx: Context, userId: string): Promise<String>;
    createGcoin(ctx: Context, userId: string, EnrollmentID: string, gcoin_num: number): Promise<string>;
    transfervalue(ctx: Context, sender: string, receiver: string, receiver_enrollmentID: string, amount_Gcoin: number): Promise<string>;
}
