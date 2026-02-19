import * as offersService from "../services/offers.service.js";

export const createOffer = async (req, res) => {
  try {
    const data = req.body;

    await offersService.createNewOffer({ data });

    res.status(201).json({ message: "Offer created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllOffersByUserId = async (req, res) => {
  try {
    const id = req.params.id;
    const offers = await offersService.getAllOffersByUserId(id);

    res.status(200).json({ offers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOfferById = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    await offersService.updateOfferById({ id, data });

    res.status(200).json({ message: "Offer updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteOfferById = async (req, res) => {
  try {
    const id = req.params.id;
    await offersService.deleteOfferById({ id });
    res.status(200).json({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
