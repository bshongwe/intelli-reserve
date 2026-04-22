const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDef = protoLoader.loadSync('./backend/proto/subscription.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: ['./backend/proto'],
});

const protoDescriptor = grpc.loadPackageDefinition(packageDef);
const subscription = protoDescriptor.intelli_reserve.subscription;

const client = new subscription.SubscriptionService('localhost:50009', grpc.credentials.createInsecure());

client.getSubscriptionPlans({}, (err, response) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Response:', JSON.stringify(response, null, 2));
  }
  process.exit(0);
});
