const respone = (statusCode, message, data = null) => {
  return {
    statusCode,
    message,
    ...(data !== null ? { data } : {}),
  };
};

export default respone;
