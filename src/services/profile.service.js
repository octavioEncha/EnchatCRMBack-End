import * as profileModel from "../models/profile.model.js";
import { sendEmailConfirmRegistration } from "../utils/sendingEmail.util.js";
import jwt from "jsonwebtoken";

export const findProfileById = async ({ id }) => {
  const profile = await profileModel.findProfileById({ id });

  return profile;
};

export const findProfileByEmail = async ({ email }) => {
  const profile = await profileModel.findUserByEmail({ email });

  if (!profile) {
    throw new Error("E-mail not found");
  }
  return profile;
};

export const createToken = async ({ data }) => {
  const findProfile = await profileModel.findProfileById({
    id: data.id_profile,
  });
  if (!findProfile) {
    throw new Error("Profile not found");
  }

  const token = jwt.sign({ id: findProfile.id }, process.env.JWT_SECRET, {
    expiresIn: "365d",
  });

  const updateTokenProfile = await profileModel.updateTokenProfile({
    id: findProfile.id,
    token,
  });
  return token;
};

export const signUpProfile = async ({ data }) => {
  const searchProfile = await profileModel.findUserByEmail({
    email: data.email,
  });
  console.log(searchProfile);

  if (searchProfile) {
    throw new Error("E-mail already exist");
  }

  const createProfile = await profileModel.createUser({ data });

  const updateProfileNam = await profileModel.updateProfileName({
    id: createProfile.user?.id,
    name: data.name,
  });

  return await sendEmailConfirmRegistration({
    to: data.email,
    name: data.name,
  });
};
