
exports.handler = async (context, event, callback) => {
  const response = new Twilio.Response();
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  response.setHeaders(headers);

  let client = context.getTwilioClient();

  const syncServiceSid = context.TWILIO_SYNC_SERVICE_SID;
  const syncListName = 'incoming';
  const syncClient = Runtime.getSync({ serviceName: syncServiceSid });
  let updateError = '';
  let t = {
      'amount':event.amount,
      'from':event.donorName || 'Anonymous',
      'contact':event.from
    }

  try {
    // Ensure that the Sync List exists before we try to add a new message to it
    //await getOrCreateResource(syncClient.lists, syncListName);

    await syncClient.lists(syncListName).syncListItems.create({
      data: t
    });
    response.setBody({
      response: 'updated'    
    });
  } catch (error) {
    console.error(error);
  }

  return callback(updateError || null, response);
};



// Helper method to simplify getting a Sync resource (Document, List, or Map)
// that handles the case where it may not exist yet.
const getOrCreateResource = async (resource, name, options = {}) => {
  try {
    // Does this resource (Sync Document, List, or Map) exist already? Return it
    return await resource(name).fetch();
  } catch (err) {
    // It doesn't exist, create a new one with the given name and return it
    options.uniqueName = name;
    return resource.create(options);
  }
};
