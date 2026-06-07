import { permissionModel } from "../models/index.js";
import BaseRepository from "./base.repository.js";

class PermissionRepository extends BaseRepository {
  constructor() {
    super(permissionModel);
  }
}

export default new PermissionRepository();
