import { invoiceModel } from "../models/index.js";
import BaseRepository from "./base.repository.js";

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(invoiceModel);
  }
}

export default new InvoiceRepository();
