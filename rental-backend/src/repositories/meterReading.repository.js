import { meterReadingModel } from "../models/index.js";
import BaseRepository from "./base.repository.js";

class MeterReadingRepository extends BaseRepository {
  constructor() {
    super(meterReadingModel);
  }
}

export default new MeterReadingRepository();
