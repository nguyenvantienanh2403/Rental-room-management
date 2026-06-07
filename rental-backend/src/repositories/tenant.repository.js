import { tenantModel } from "../models/index.js";
import BaseRepository from "./base.repository.js";

class TenantRepository extends BaseRepository {
  constructor() {
    super(tenantModel);
  }
}

export default new TenantRepository();
