export default () => {
  return {
    jwt_secret: process.env.JWT_SECRET,
    port: parseInt(process.env.PORT || '3000'),
    api_gateway_grpc_port: parseInt(process.env.API_GATEWAY_GRPC_PORT || '50051'),
  };
};
