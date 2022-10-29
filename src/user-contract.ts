/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Context,
    Contract,
    Info,
    Returns,
    Transaction,
} from "fabric-contract-api";
import { User } from "./user";
import { ClientIdentity } from "fabric-shim";

@Info({ title: "UserContract", description: "green-coin chaincode" })
export class UserContract extends Contract {
    public async userExists(ctx: Context, userId: string): Promise<boolean> {
        const data: Uint8Array = await ctx.stub.getState(userId);
        return Boolean(data) && data.length > 0;
    }

    @Transaction(true)
    public async createUser(
        ctx: Context,
        userId: string,
        EnrollmentID: string
        //balance: number
    ): Promise<void> {
        const exists: boolean = await this.userExists(ctx, userId);
        if (exists) {
            throw new Error(`The user ${userId} already exists`);
        }
        const user: User = new User();
        user.EnrollmentID = EnrollmentID;
        user.balance = 0;
        const buffer: Buffer = Buffer.from(JSON.stringify(user));
        await ctx.stub.putState(userId, buffer);
    }
    @Transaction(false)
    // @Returns("User")
    public async readUser(ctx: Context, userId: string): Promise<User> {
        const exists: boolean = await this.userExists(ctx, userId);
        if (!exists) {
            throw new Error(`The user ${userId} does not exist`);
        }
        const naam: String = await this.getEnrollID(ctx, userId);
        const identity: ClientIdentity = ctx.clientIdentity;
        const checkusr: boolean = identity.assertAttributeValue(
            "hf.EnrollmentID",
            `${naam}`
        );
        if (checkusr) {
            const data: Uint8Array = await ctx.stub.getState(userId);
            const user: User = JSON.parse(data.toString()) as User;
            return user;
        } else {
            throw new Error(`*****you are not allowed for this operation*****`);
        }
    }
    @Transaction(false)
    public async queryAllUsers(ctx: Context): Promise<string> {
        const identity: ClientIdentity = ctx.clientIdentity;
        const checkAttr: boolean = identity.assertAttributeValue(
            "hf.Affiliation",
            "searcher"
        );
        const checkAttr2: boolean = identity.assertAttributeValue(
            "hf.Affiliation",
            "every"
        );
        if (checkAttr || checkAttr2) {
            const startKey = "000";
            const endKey = "999";
            const iterator = await ctx.stub.getStateByRange(startKey, endKey);
            const allResults = [];
            while (true) {
                const res = await iterator.next();
                if (res.value && res.value.value.toString()) {
                    console.log(res.value.value.toString());

                    const Key = res.value.key;
                    let Record;
                    try {
                        Record = JSON.parse(res.value.value.toString());
                    } catch (err) {
                        console.log(err);
                        Record = res.value.value.toString();
                    }
                    allResults.push({ Key, Record });
                }
                if (res.done) {
                    console.log("end of data");
                    await iterator.close();
                    console.info(allResults);
                    return JSON.stringify(allResults);
                }
            }
        } else {
            throw new Error("*****you dont have permission*****");
        }
    }
    public async getEnrollID(ctx: Context, userId: string): Promise<String> {
        const userinformation: Uint8Array = await ctx.stub.getState(userId);
        const userasuser: User = JSON.parse(userinformation.toString()) as User;
        let shenase = userasuser.EnrollmentID;
        return shenase;
    }
    @Transaction(true)
    public async createGcoin(
        ctx: Context,
        userId: string,
        EnrollmentID: string,
        gcoin_num: number //gcoin_num
    ): Promise<string> {
        // const exists: boolean = await this.userExists(ctx, userId);
        //if (!exists) {
        //   await this.createUser(ctx, userId, EnrollmentID, 0);
        //   return "*****new user created successfully. to create gcoin by this ID enter with this user account and invoke the function again***";
        //} else {
        if (gcoin_num < 0) {
            throw new Error(`This ammount is unacceptable`);
        } else {
            const EnrollID: String = await this.getEnrollID(ctx, userId);
            const identity: ClientIdentity = ctx.clientIdentity;
            const checkAttr: boolean = identity.assertAttributeValue(
                "hf.Affiliation",
                "maker"
            );
            const checkAttr2: boolean = identity.assertAttributeValue(
                "hf.Affiliation",
                "every"
            );
            if (checkAttr || checkAttr2) {
                const identity2: ClientIdentity = ctx.clientIdentity;
                const checkid: boolean = identity2.assertAttributeValue(
                    "hf.EnrollmentID",
                    `${EnrollID}`
                );
                if (checkid) {
                    const userinfo: Uint8Array = await ctx.stub.getState(
                        userId
                    );
                    const useruser: User = JSON.parse(
                        userinfo.toString()
                    ) as User;

                    let newvalue = +useruser.balance + gcoin_num;
                    useruser.balance = newvalue;
                    const buffer: Buffer = Buffer.from(
                        JSON.stringify(useruser)
                    );
                    await ctx.stub.putState(userId, buffer);
                } else {
                    throw new Error(
                        "*****you can not create coin by other IDs *****"
                    );
                }
            } else {
                throw new Error(
                    "*****you dont have permission to create Gcoin!*****"
                );
            }
            return "Gcoin Created successfully";
        }
    }
    @Transaction(true)
    public async transfervalue(
        ctx: Context,
        sender: string,
        receiver: string,
        receiver_enrollmentID: string,
        amount_Gcoin: number
    ): Promise<string> {
        if (amount_Gcoin < 0) {
            throw new Error(`This ammount is unacceptable`);
        } else {
            const exists: boolean = await this.userExists(ctx, sender);
            if (!exists) {
                throw new Error(`The user ${sender} does not exist`);
            }
            const exists2: boolean = await this.userExists(ctx, receiver);
            if (!exists2) {
                throw new Error(`The user ${sender} does not exist`);
            }

            const EnrollID: String = await this.getEnrollID(ctx, sender);
            const identity: ClientIdentity = ctx.clientIdentity;
            const checkAttr: boolean = identity.assertAttributeValue(
                `hf.EnrollmentID`,
                `${EnrollID}`
            );
            if (checkAttr) {
                const datasender: Uint8Array = await ctx.stub.getState(sender);
                const gcoinsender: User = JSON.parse(
                    datasender.toString()
                ) as User;
                if (gcoinsender.balance >= amount_Gcoin) {
                    let newvalue = +gcoinsender.balance - amount_Gcoin;
                    gcoinsender.balance = newvalue;
                    const buffer: Buffer = Buffer.from(
                        JSON.stringify(gcoinsender)
                    );
                    await ctx.stub.putState(sender, buffer);
                    const datareceiver: Uint8Array = await ctx.stub.getState(
                        receiver
                    );
                    const gcoinreceiver: User = JSON.parse(
                        datareceiver.toString()
                    ) as User;
                    let newvalue2 = +gcoinreceiver.balance + amount_Gcoin;
                    gcoinreceiver.balance = newvalue2;
                    const buffer2: Buffer = Buffer.from(
                        JSON.stringify(gcoinreceiver)
                    );
                    await ctx.stub.putState(receiver, buffer2);
                } else {
                    throw new Error("***not enough Ceredit***");
                }
            } else {
                throw new Error(
                    `***Only ${EnrollID} can transfer money from this account!***`
                );
            }
            return "transaction performed successfully";
        }
    }
}
