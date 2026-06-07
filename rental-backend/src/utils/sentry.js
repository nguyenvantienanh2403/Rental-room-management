import * as Sentry from "@sentry/node";
import env from "../config/env.config.js";

const sentryHelper = {
  captureException(err, context) {
    if (env.sentry?.dsn) {
      Sentry.captureException(err, context);
    }
  }
};

export default sentryHelper;
