import { Request, Response } from "express";

import { ContactsService } from "./contacts.service.js";
import { BadRequestError } from "../../common/errors/BadRequestError.js";

export class ContactsController {

  private readonly service =
    new ContactsService();

  getContacts = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const result =
      await this.service.getContacts(
        req.tenant!.id,
        req.query
      );

    res.json({
      success: true,
      data: result
    });
  };

  getContactById = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const contactId =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    if (!contactId) {
      throw new BadRequestError(
        "Contact id required"
      );
    }

    const result =
      await this.service.getContactById(
        req.tenant!.id,
        contactId
      );

    res.json({
      success: true,
      data: result
    });
  };

  getContactTimeline = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const contactId =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    if (!contactId) {
      throw new BadRequestError(
        "Contact id required"
      );
    }

    const result =
      await this.service.getContactTimeline(
        req.tenant!.id,
        contactId
      );

    res.json({
      success: true,
      data: result
    });
  };

  updateContact = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const contactId =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    if (!contactId) {
      throw new BadRequestError(
        "Contact id required"
      );
    }

    const result =
      await this.service.updateContact(
        req.tenant!.id,
        contactId,
        req.body
      );

    res.json({
      success: true,
      data: result
    });
  };

  deleteContact = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const contactId =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    if (!contactId) {
      throw new BadRequestError(
        "Contact id required"
      );
    }

    const result =
      await this.service.deleteContact(
        req.tenant!.id,
        contactId
      );

    res.json({
      success: true,
      data: result
    });
  };
}