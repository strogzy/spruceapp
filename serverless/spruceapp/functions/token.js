const AccessToken = Twilio.jwt.AccessToken;
const SyncGrant = AccessToken.SyncGrant;

exports.handler = (context, event, callback) => {
  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');

  // Create a Sync Grant for a particular Sync service, or use the default one
  const syncGrant = new SyncGrant({
    serviceSid: context.TWILIO_SYNC_SERVICE_SID || 'default',
  });

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  // Use environment variables via `context` to keep your credentials secure
  const token = new AccessToken(
    context.ACCOUNT_SID,
    context.TWILIO_API_KEY,
    context.TWILIO_API_SECRET,
    { identity: event.identity || 'example' }
  );

  token.addGrant(syncGrant);

  response.setBody({
    token: token.toJwt(),
  });
  //console.log(response.body);

  return callback(null, response);
};