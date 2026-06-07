import { contractModel } from "../models/index.js";
import BaseRepository from "./base.repository.js";

class ContractRepository extends BaseRepository {
  constructor() {
    super(contractModel);
  }
}

export default new ContractRepository();
