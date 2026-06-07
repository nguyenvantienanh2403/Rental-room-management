import { token as tokenModel } from "../models/index.js";
import BaseRepository from "./base.repository.js";

class TokenRepository extends BaseRepository {
  constructor() {
    super(tokenModel);
  }
}

export default new TokenRepository();
