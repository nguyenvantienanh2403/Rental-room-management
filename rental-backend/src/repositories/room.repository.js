import { roomModel } from "../models/index.js";
import BaseRepository from "./base.repository.js";

class RoomRepository extends BaseRepository {
  constructor() {
    super(roomModel);
  }
}

export default new RoomRepository();
