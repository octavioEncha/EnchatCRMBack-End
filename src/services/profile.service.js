import * as profileModel from "../models/profile.model.js";
import jwt from "jsonwebtoken";

export const findProfileById = async ({ id }) => {
  const profile = await profileModel.findProfileById({ id });

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
