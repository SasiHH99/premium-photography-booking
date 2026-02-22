exports.handler = async (event) => {
  return {
    statusCode: 405,
    body: "Method Not Allowed"
  };
};
