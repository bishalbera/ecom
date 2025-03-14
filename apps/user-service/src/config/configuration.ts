export default () => {
      return {
        port: parseInt(process.env.PORT || '3000'),

        jwt_secret: process.env.JWT_SECRET,
        user_service_grpc_port: parseInt(process.env.USER_SERVICE_GRPC_PORT || '50051'),
      };
}