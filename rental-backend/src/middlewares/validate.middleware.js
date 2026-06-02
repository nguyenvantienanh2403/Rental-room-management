import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/index.js";

/**
 * Middleware factory để validate request bằng Joi schema.
 *
 * @param {import("joi").ObjectSchema} schema — Joi schema để validate
 * @param {string} [source="body"] — Nguồn dữ liệu cần validate ("body" | "query" | "params")
 * @returns {import("express").RequestHandler}
 *
 * @example
 * // Trong route:
 * router.post("/", validate(createBuildingSchema), controller.create);
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Trả về TẤT CẢ lỗi, không dừng ở lỗi đầu tiên
      stripUnknown: true, // Loại bỏ các field không có trong schema
      errors: {
        wrap: { label: false }, // Không wrap label trong dấu ngoặc kép
      },
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(", ");

      throw new ApiError(StatusCodes.BAD_REQUEST, message);
    }

    // Gán lại giá trị đã validate (đã strip unknown fields)
    req[source] = value;
    next();
  };
};

export default validate;
