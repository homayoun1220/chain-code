"use strict";
/*
 * SPDX-License-Identifier: Apache-2.0
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserContract = void 0;
const fabric_contract_api_1 = require("fabric-contract-api");
const user_1 = require("./user");
let UserContract = class UserContract extends fabric_contract_api_1.Contract {
    async userExists(ctx, userId) {
        const data = await ctx.stub.getState(userId);
        return Boolean(data) && data.length > 0;
    }
    async createUser(ctx, userId, EnrollmentID
    //balance: number
    ) {
        const exists = await this.userExists(ctx, userId);
        if (exists) {
            throw new Error(`The user ${userId} already exists`);
        }
        const user = new user_1.User();
        user.EnrollmentID = EnrollmentID;
        user.balance = 0;
        const buffer = Buffer.from(JSON.stringify(user));
        await ctx.stub.putState(userId, buffer);
    }
    async readUser(ctx, userId) {
        const exists = await this.userExists(ctx, userId);
        if (!exists) {
            throw new Error(`The user ${userId} does not exist`);
        }
        const naam = await this.getEnrollID(ctx, userId);
        const identity = ctx.clientIdentity;
        const checkusr = identity.assertAttributeValue("hf.EnrollmentID", `${naam}`);
        if (checkusr) {
            const data = await ctx.stub.getState(userId);
            const user = JSON.parse(data.toString());
            return user;
        }
        else {
            throw new Error(`*****you are not allowed for this operation*****`);
        }
    }
    async queryAllUsers(ctx) {
        const identity = ctx.clientIdentity;
        const checkAttr = identity.assertAttributeValue("hf.Affiliation", "searcher");
        const checkAttr2 = identity.assertAttributeValue("hf.Affiliation", "every");
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
                    }
                    catch (err) {
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
        }
        else {
            throw new Error("*****you dont have permission*****");
        }
    }
    async getEnrollID(ctx, userId) {
        const userinformation = await ctx.stub.getState(userId);
        const userasuser = JSON.parse(userinformation.toString());
        let shenase = userasuser.EnrollmentID;
        return shenase;
    }
    async createGcoin(ctx, userId, EnrollmentID, gcoin_num //gcoin_num
    ) {
        // const exists: boolean = await this.userExists(ctx, userId);
        //if (!exists) {
        //   await this.createUser(ctx, userId, EnrollmentID, 0);
        //   return "*****new user created successfully. to create gcoin by this ID enter with this user account and invoke the function again***";
        //} else {
        if (!Number.isInteger(gcoin_num)) {
            throw new Error("This ammount is unacceptable");
        }
        if (gcoin_num < 0) {
            throw new Error(`This ammount is unacceptable`);
        }
        else {
            const EnrollID = await this.getEnrollID(ctx, userId);
            const identity = ctx.clientIdentity;
            const checkAttr = identity.assertAttributeValue("hf.Affiliation", "maker");
            const checkAttr2 = identity.assertAttributeValue("hf.Affiliation", "every");
            if (checkAttr || checkAttr2) {
                const identity2 = ctx.clientIdentity;
                const checkid = identity2.assertAttributeValue("hf.EnrollmentID", `${EnrollID}`);
                if (checkid) {
                    const userinfo = await ctx.stub.getState(userId);
                    const useruser = JSON.parse(userinfo.toString());
                    let newvalue = +useruser.balance + gcoin_num;
                    useruser.balance = newvalue;
                    const buffer = Buffer.from(JSON.stringify(useruser));
                    await ctx.stub.putState(userId, buffer);
                }
                else {
                    throw new Error("*****you can not create coin by other IDs *****");
                }
            }
            else {
                throw new Error("*****you dont have permission to create Gcoin!*****");
            }
            return "Gcoin Created successfully";
        }
    }
    async transfervalue(ctx, sender, receiver, receiver_enrollmentID, amount_Gcoin) {
        if (!Number.isInteger(amount_Gcoin)) {
            throw new Error("This ammount is unacceptable");
        }
        if (amount_Gcoin < 0) {
            throw new Error(`This ammount is unacceptable`);
        }
        else {
            const exists = await this.userExists(ctx, sender);
            if (!exists) {
                throw new Error(`The user ${sender} does not exist`);
            }
            const exists2 = await this.userExists(ctx, receiver);
            if (!exists2) {
                throw new Error(`The user ${sender} does not exist`);
            }
            const EnrollID = await this.getEnrollID(ctx, sender);
            const identity = ctx.clientIdentity;
            const checkAttr = identity.assertAttributeValue(`hf.EnrollmentID`, `${EnrollID}`);
            if (checkAttr) {
                const datasender = await ctx.stub.getState(sender);
                const gcoinsender = JSON.parse(datasender.toString());
                if (gcoinsender.balance >= amount_Gcoin) {
                    let newvalue = +gcoinsender.balance - amount_Gcoin;
                    gcoinsender.balance = newvalue;
                    const buffer = Buffer.from(JSON.stringify(gcoinsender));
                    await ctx.stub.putState(sender, buffer);
                    const datareceiver = await ctx.stub.getState(receiver);
                    const gcoinreceiver = JSON.parse(datareceiver.toString());
                    let newvalue2 = +gcoinreceiver.balance + amount_Gcoin;
                    gcoinreceiver.balance = newvalue2;
                    const buffer2 = Buffer.from(JSON.stringify(gcoinreceiver));
                    await ctx.stub.putState(receiver, buffer2);
                }
                else {
                    throw new Error("***not enough Ceredit***");
                }
            }
            else {
                throw new Error(`***Only ${EnrollID} can transfer money from this account!***`);
            }
            return "transaction performed successfully";
        }
    }
};
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String]),
    __metadata("design:returntype", Promise)
], UserContract.prototype, "createUser", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], UserContract.prototype, "readUser", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], UserContract.prototype, "queryAllUsers", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, Number]),
    __metadata("design:returntype", Promise)
], UserContract.prototype, "createGcoin", null);
__decorate([
    fabric_contract_api_1.Transaction(true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, String, Number]),
    __metadata("design:returntype", Promise)
], UserContract.prototype, "transfervalue", null);
UserContract = __decorate([
    fabric_contract_api_1.Info({ title: "UserContract", description: "green-coin chaincode" })
], UserContract);
exports.UserContract = UserContract;
//# sourceMappingURL=user-contract.js.map