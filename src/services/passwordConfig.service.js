import crypto from "crypto";
import { findProfileByEmail } from "./profile.service.js";
import { sendEmail } from "../utils/sendingEmail.util.js";
import * as passwordResetModel from "../models/passwordReset.model.js";

export const forgot_password = async ({ data }) => {
  const searchProfileByEmail = await findProfileByEmail({
    email: data.email,
  });

  const token = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date();

  const sendEmailToEmail = sendEmail({ to: data.email, token });

  const dataToSaveToken = {
    email: data.email,
    token,
    expiresAt: new Date(expiresAt.getTime() + 60 * 60 * 1000), // ✅ soma em ms
  };

  return await passwordResetModel.saveTokenResetPassword({
    data: dataToSaveToken,
  });
};

export const verifyToken = async ({ token }) => {
  const searchToken = await passwordResetModel.verifyToken({ token });
  if (!searchToken) {
    throw new Error("Token does not exist");
  }

  const expiresAt = new Date(searchToken.expiresAt);

  if (expiresAt < new Date()) {
    throw new Error("Token is expired");
  }

  return true;
};

export const updatePassword = async ({ token, data }) => {
  const searchToken = await passwordResetModel.verifyToken({ token });
  if (!searchToken) {
    throw new Error("Token does not exist");
  }
  const searchProfileByEmail = await findProfileByEmail({
    email: searchToken.email,
  });

  return await passwordResetModel.updatePassword({
    user_id: searchProfileByEmail.id,
    password: data.password,
  });
};
