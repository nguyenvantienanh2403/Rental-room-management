import { buildingModel } from "../models/index.js";
import BaseRepository from "./base.repository.js";

class BuildingRepository extends BaseRepository {
  constructor() {
    super(buildingModel);
  }
}

export default new BuildingRepository();
