import { notificationModel } from "../models/index.js";
import BaseRepository from "./base.repository.js";

class NotificationRepository extends BaseRepository {
  constructor() {
    super(notificationModel);
  }
}

export default new NotificationRepository();
