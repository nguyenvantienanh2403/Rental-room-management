import { roleModel } from "../models/index.js";
import BaseRepository from "./base.repository.js";

class RoleRepository extends BaseRepository {
  constructor() {
    super(roleModel);
  }
}

export default new RoleRepository();
